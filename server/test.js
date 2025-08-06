let updateStatus = true;
const validationErrors = {};

if (
  deleteSizes != null &&
  Array.isArray(deleteSizes) &&
  deleteSizes.length > 0
) {
  const seenDeleteSizes = [];
  const deleteSizesErrors = [];

  deleteSizes.forEach((s, i) => {
    const lowerS = s.toLowerCase();
    const errors = [];

    const existsInOriginal = product.sizes.some(
      (size) => size.size.toLowerCase() === lowerS
    );

    if (!existsInOriginal) {
      errors.push(
        `❌ Cannot delete size "${s}" because it does not exist in the original sizes list.`
      );
    }

    if (seenDeleteSizes.includes(lowerS)) {
      errors.push(
        `❌ Duplicate size "${s}" found in delete sizes list at index ${i}. Each size must be unique.`
      );
    }

    if (errors.length > 0) {
      deleteSizesErrors.push({
        index: i,
        message: errors
      });
    }

    seenDeleteSizes.push(lowerS);
  });

  if (deleteSizesErrors.length > 0) {
    validationErrors.deleteSizes = deleteSizesErrors;
    updateStatus = false;
  }
}
