const Busboy = require("busboy");

async function parseJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) {
    return {};
  }

  return JSON.parse(raw);
}

async function parseMultipartPdf(req) {
  return new Promise((resolve, reject) => {
    const contentType = String(req.headers["content-type"] || "").toLowerCase();
    if (!contentType.includes("multipart/form-data")) {
      reject(new Error("Se esperaba contenido multipart/form-data."));
      return;
    }

    const busboy = Busboy({
      headers: req.headers,
      limits: {
        files: 1,
        fileSize: 25 * 1024 * 1024,
      },
    });

    let fileFound = false;
    let fileName = "";
    let mimeType = "";
    let exceededSize = false;
    const chunks = [];

    busboy.on("file", (fieldName, file, info) => {
      if (fieldName !== "pdf") {
        file.resume();
        return;
      }

      fileFound = true;
      fileName = info.filename || "archivo.pdf";
      mimeType = info.mimeType || "";

      file.on("data", (chunk) => {
        chunks.push(chunk);
      });

      file.on("limit", () => {
        exceededSize = true;
      });
    });

    busboy.on("error", (error) => {
      reject(error);
    });

    busboy.on("finish", () => {
      if (!fileFound) {
        reject(new Error("Debes adjuntar un archivo en el campo 'pdf'."));
        return;
      }

      if (exceededSize) {
        reject(new Error("El PDF supera el limite de 25 MB."));
        return;
      }

      resolve({
        fileName,
        mimeType,
        buffer: Buffer.concat(chunks),
      });
    });

    req.pipe(busboy);
  });
}

module.exports = {
  parseJsonBody,
  parseMultipartPdf,
};
