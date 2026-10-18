export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export const validMobile = (m: string) => /^[6-9]\d{9}$/.test(m);

export async function compressImage(file: File, max = 1000, quality = 0.82): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * s);
  c.height = Math.round(bmp.height * s);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res, rej) =>
    c.toBlob((b) => (b ? res(b) : rej(new Error("Image could not be read"))), "image/jpeg", quality)
  );
}

export const blobToDataUrl = (b: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(new Error("Image could not be read"));
    r.readAsDataURL(b);
  });
