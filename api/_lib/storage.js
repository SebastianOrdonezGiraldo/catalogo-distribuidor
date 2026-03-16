function isBucketMissingError(error) {
  const message = String(error?.message || "").toLowerCase();
  const status = String(error?.statusCode || error?.status || "").toLowerCase();
  if (message.includes("related resource does not exist")) return true;
  if (message.includes("bucket") && message.includes("not")) return true;
  if (status === "404") return true;
  return false;
}

async function ensureBucketExists(supabase, bucketName) {
  const { error: readError } = await supabase.storage.getBucket(bucketName);
  if (!readError) {
    return { ok: true, created: false };
  }

  if (!isBucketMissingError(readError)) {
    return { ok: false, error: readError };
  }

  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    public: false,
  });

  if (createError) {
    const message = String(createError.message || "").toLowerCase();
    if (!message.includes("already")) {
      return { ok: false, error: createError };
    }
  }

  return { ok: true, created: true };
}

module.exports = {
  ensureBucketExists,
  isBucketMissingError,
};
