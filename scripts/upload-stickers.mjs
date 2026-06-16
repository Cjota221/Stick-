import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const BUCKET = "sticke-assets";
const DEFAULT_CONCURRENCY = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MIME_TYPES = new Map([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
]);
const UPLOAD_RETRIES = 3;

function printHelp() {
  console.log(`
Upload massivo Stickê

Cada subpasta da raiz vira um pack. As imagens dentro dela viram figurinhas.

Uso:
  npm run upload-stickers -- --root "C:\\caminho\\UNIVERSAL - FRASES" --dry-run
  npm run upload-stickers -- --root "C:\\caminho\\UNIVERSAL - FRASES"

Opções:
  --root <pasta>         Pasta que contém as subpastas/packs
  --concurrency <1-10>   Uploads simultâneos (padrão: 5)
  --dry-run              Mostra o plano sem alterar Supabase
  --help                 Mostra esta ajuda
`);
}

function parseArgs(args) {
  const options = {
    concurrency: DEFAULT_CONCURRENCY,
    dryRun: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--root") options.root = args[++index];
    else if (arg === "--concurrency") options.concurrency = Number(args[++index]);
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--help") options.help = true;
    else throw new Error(`Opção desconhecida: ${arg}`);
  }

  return options;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Preencha ${name} no arquivo .env.local.`);
  return value;
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatName(value) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR")
    .replace(/(^|\s)\S/g, (letter) => letter.toLocaleUpperCase("pt-BR"));
}

function naturalCompare(a, b) {
  return a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" });
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return results;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function listPackFolders(root) {
  const entries = await readdir(root, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => naturalCompare(a.name, b.name));
}

async function listImages(folder, relativeFolder = "") {
  const currentFolder = path.join(folder, relativeFolder);
  const entries = await readdir(currentFolder, { withFileTypes: true });
  const images = [];

  for (const entry of entries.sort((a, b) => naturalCompare(a.name, b.name))) {
    const relativePath = path.join(relativeFolder, entry.name);
    if (entry.isDirectory()) {
      images.push(...(await listImages(folder, relativePath)));
    } else if (
      entry.isFile() &&
      MIME_TYPES.has(path.extname(entry.name).toLowerCase())
    ) {
      images.push(relativePath);
    }
  }

  return images;
}

async function buildPlan(root) {
  const folders = await listPackFolders(root);
  const plan = [];

  for (const [sortOrder, folder] of folders.entries()) {
    const folderPath = path.join(root, folder.name);
    const images = await listImages(folderPath);
    if (!images.length) continue;

    const files = [];
    for (const [imageIndex, relativePath] of images.entries()) {
      const filePath = path.join(folderPath, relativePath);
      const fileStat = await stat(filePath);
      if (fileStat.size > MAX_FILE_SIZE) {
        throw new Error(`${filePath} excede o limite de 10 MB.`);
      }

      const fileName = path.basename(relativePath);
      const extension = path.extname(fileName).toLowerCase();
      const baseName = path.parse(fileName).name;
      const nestedFolder = path.dirname(relativePath);
      const displayName =
        nestedFolder === "."
          ? formatName(baseName)
          : `${formatName(nestedFolder)} - ${formatName(baseName)}`;
      const fingerprint = createHash("sha1")
        .update(`${folder.name}/${relativePath}`)
        .digest("hex")
        .slice(0, 10);

      files.push({
        fileName,
        filePath,
        contentType: MIME_TYPES.get(extension),
        name: displayName,
        sortOrder: imageIndex,
        storagePath: `stickers/${slugify(folder.name)}/${String(imageIndex + 1).padStart(4, "0")}-${fingerprint}${extension}`,
      });
    }

    plan.push({
      folderName: folder.name,
      name: formatName(folder.name),
      sortOrder,
      files,
    });
  }

  return plan;
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function ensurePack(supabase, packPlan) {
  const { data: existing, error: findError } = await supabase
    .from("sticke_packs")
    .select("id,name")
    .eq("name", packPlan.name)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return { ...existing, created: false };

  const coverPath = packPlan.files[0].storagePath;
  const { data: coverData } = supabase.storage.from(BUCKET).getPublicUrl(coverPath);
  const { data: created, error: createError } = await supabase
    .from("sticke_packs")
    .insert({
      name: packPlan.name,
      description: `Pack ${packPlan.name} - ${packPlan.files.length} figurinhas`,
      cover_url: coverData.publicUrl,
      price: 0,
      is_active: true,
      sort_order: packPlan.sortOrder,
    })
    .select("id,name")
    .single();
  if (createError) throw createError;
  return { ...created, created: true };
}

async function processPack(supabase, packPlan, options, packNumber, totalPacks) {
  const pack = await ensurePack(supabase, packPlan);
  const { data: existingRows, error: existingError } = await supabase
    .from("sticke_stickers")
    .select("image_url")
    .eq("pack_id", pack.id);
  if (existingError) throw existingError;

  const existingUrls = new Set(
    (existingRows ?? []).map((sticker) => sticker.image_url),
  );
  const candidates = packPlan.files.map((file) => {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(file.storagePath);
    return { ...file, publicUrl: data.publicUrl };
  });
  const pending = candidates.filter((file) => !existingUrls.has(file.publicUrl));

  console.log(
    `\n[${packNumber}/${totalPacks}] ${packPlan.name}: ${pending.length} novas de ${candidates.length}`,
  );
  if (!pending.length) return { uploaded: 0, skipped: candidates.length };

  const uploadedPaths = [];
  try {
    await mapWithConcurrency(
      pending,
      options.concurrency,
      async (file, index) => {
        const buffer = await readFile(file.filePath);
        let lastError = null;
        let uploaded = false;
        for (let attempt = 1; attempt <= UPLOAD_RETRIES; attempt += 1) {
          const { error } = await supabase.storage
            .from(BUCKET)
            .upload(file.storagePath, buffer, {
              contentType: file.contentType,
              cacheControl: "31536000",
              upsert: false,
            });

          if (!error || /already exists|duplicate/i.test(error.message)) {
            lastError = null;
            uploaded = true;
            break;
          }

          lastError = error;
          if (attempt < UPLOAD_RETRIES) {
            await sleep(1000 * attempt);
          }
        }

        if (lastError) {
          throw new Error(`${file.fileName}: ${lastError.message}`);
        }
        if (uploaded) uploadedPaths.push(file.storagePath);
        process.stdout.write(`\r  Upload ${index + 1}/${pending.length}`);
      },
    );
    process.stdout.write("\n");

    const rows = pending.map((file) => ({
      pack_id: pack.id,
      name: file.name,
      image_url: file.publicUrl,
      sort_order: file.sortOrder,
    }));

    for (const batch of chunk(rows, 200)) {
      const { error } = await supabase.from("sticke_stickers").insert(batch);
      if (error) throw error;
    }

    return {
      uploaded: pending.length,
      skipped: candidates.length - pending.length,
    };
  } catch (error) {
    if (uploadedPaths.length) {
      console.log("  Erro no banco. Removendo arquivos desta tentativa...");
      const { error: cleanupError } = await supabase.storage
        .from(BUCKET)
        .remove(uploadedPaths);
      if (cleanupError) {
        console.error(`  Falha na limpeza: ${cleanupError.message}`);
      }
    }
    throw error;
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }
  if (!options.root) {
    printHelp();
    throw new Error("Informe a pasta raiz com --root.");
  }
  if (
    !Number.isInteger(options.concurrency) ||
    options.concurrency < 1 ||
    options.concurrency > 10
  ) {
    throw new Error("--concurrency deve estar entre 1 e 10.");
  }

  const root = path.resolve(options.root);
  const rootStat = await stat(root).catch(() => null);
  if (!rootStat?.isDirectory()) {
    throw new Error(`Pasta não encontrada: ${root}`);
  }

  const plan = await buildPlan(root);
  const totalImages = plan.reduce((total, pack) => total + pack.files.length, 0);
  if (!plan.length) throw new Error("Nenhuma subpasta com imagens foi encontrada.");

  console.log("Stickê - Upload massivo");
  console.log(`Raiz: ${root}`);
  console.log(`Packs: ${plan.length} | Imagens: ${totalImages}`);
  for (const pack of plan) {
    console.log(`  ${pack.name}: ${pack.files.length}`);
  }

  if (options.dryRun) {
    console.log("\nSimulação concluída. Nada foi alterado no Supabase.");
    return;
  }

  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  let uploaded = 0;
  let skipped = 0;
  for (const [index, pack] of plan.entries()) {
    const result = await processPack(
      supabase,
      pack,
      options,
      index + 1,
      plan.length,
    );
    uploaded += result.uploaded;
    skipped += result.skipped;
  }

  console.log(`\nConcluído. Novas: ${uploaded} | Já existentes: ${skipped}`);
  console.log("As novas categorias ficam visíveis automaticamente na galeria.");
}

main().catch((error) => {
  console.error(`\nErro: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
