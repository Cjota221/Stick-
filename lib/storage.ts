export function getStoragePath(assetUrl: string) {
  const markers = [
    "/storage/v1/object/public/sticke-assets/",
    "/storage/v1/object/sign/sticke-assets/",
  ];
  for (const marker of markers) {
    const index = assetUrl.indexOf(marker);
    if (index >= 0) {
      return decodeURIComponent(assetUrl.slice(index + marker.length).split("?")[0]);
    }
  }
  return assetUrl.replace(/^\/+/, "").split("?")[0];
}
