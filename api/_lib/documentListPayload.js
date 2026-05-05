const { DOCUMENTS } = require("./documents");
const { ensureStorageDir, getDocumentInfo } = require("./filesystem");

async function getDocumentsPayload(storageDir) {
  await ensureStorageDir(storageDir);

  const documents = await Promise.all(
    DOCUMENTS.map(async (doc) => {
      const storageItem = await getDocumentInfo(storageDir, doc.filename);

      return {
        ...doc,
        url: `/docs/${encodeURIComponent(doc.filename)}`,
        exists: storageItem.exists,
        size: storageItem.size,
        updatedAt: storageItem.updatedAt,
      };
    }),
  );

  return { documents };
}

module.exports = {
  getDocumentsPayload,
};
