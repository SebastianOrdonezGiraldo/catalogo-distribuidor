const fs = require("fs/promises");
const path = require("path");

async function ensureStorageDir(storageDir) {
  await fs.mkdir(storageDir, { recursive: true });
}

async function seedDocuments(storageDir, sourceDir, filenames) {
  await ensureStorageDir(storageDir);

  await Promise.all(
    filenames.map(async (filename) => {
      const sourcePath = path.join(sourceDir, filename);
      const destinationPath = getDocumentPath(storageDir, filename);

      try {
        await fs.stat(destinationPath);
        return;
      } catch (error) {
        if (!error || error.code !== "ENOENT") {
          throw error;
        }
      }

      try {
        await fs.copyFile(sourcePath, destinationPath);
      } catch (error) {
        if (!error || error.code !== "ENOENT") {
          throw error;
        }
      }
    }),
  );
}

/** Una sola vez: copiar PDF incluidos en el repo al almacén. Reinicios siguientes no reviven borrados desde el admin. */
const SEED_MARKER_FILENAME = ".bundled_catalog_seed_done";

function isBundledSeedForced() {
  const v = String(process.env.DOCUMENTS_FORCE_RESEED || "").toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

async function seedBundledDocumentsOnce(storageDir, sourceDir, filenames) {
  await ensureStorageDir(storageDir);

  const markerPath = path.join(storageDir, SEED_MARKER_FILENAME);
  if (!isBundledSeedForced()) {
    try {
      await fs.stat(markerPath);
      return;
    } catch (error) {
      if (!error || error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  await seedDocuments(storageDir, sourceDir, filenames);
  await fs.writeFile(markerPath, `${new Date().toISOString()}\n`, "utf8");
}

function getDocumentPath(storageDir, filename) {
  return path.join(storageDir, filename);
}

async function getDocumentInfo(storageDir, filename) {
  const filePath = getDocumentPath(storageDir, filename);

  try {
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      return {
        exists: false,
        size: 0,
        updatedAt: null,
      };
    }

    return {
      exists: true,
      size: stats.size,
      updatedAt: stats.mtime.toISOString(),
    };
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return {
        exists: false,
        size: 0,
        updatedAt: null,
      };
    }

    throw error;
  }
}

async function readDocument(storageDir, filename) {
  return fs.readFile(getDocumentPath(storageDir, filename));
}

async function writeDocument(storageDir, filename, buffer) {
  await ensureStorageDir(storageDir);
  await fs.writeFile(getDocumentPath(storageDir, filename), buffer);
}

async function deleteDocument(storageDir, filename) {
  try {
    await fs.unlink(getDocumentPath(storageDir, filename));
    return { deleted: true };
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return { deleted: false };
    }
    throw error;
  }
}

module.exports = {
  ensureStorageDir,
  seedDocuments,
  seedBundledDocumentsOnce,
  getDocumentPath,
  getDocumentInfo,
  readDocument,
  writeDocument,
  deleteDocument,
};
