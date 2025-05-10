  // if (product.sizes.length > 0) {
  //   console.log("yes");
  // } else {
  //   console.log("no");
  //   if (sizes) {
  //     if (price !== 0) {
  //       return next(
  //         new ApiError(
  //           "You cannot add sizes if the general product price is not zero.",
  //           400
  //         )
  //       );
  //     }
  //     if (priceAfterDiscount !== 0) {
  //       return next(
  //         new ApiError(
  //           "You cannot add sizes if the general product price after discount is not zero.",
  //           400
  //         )
  //       );
  //     }
  //     if (quantity !== 0) {
  //       return next(
  //         new ApiError(
  //           "You cannot add sizes if the general product quantity is not zero.",
  //           400
  //         )
  //       );
  //     }
  //     if (colors.length > 0) {
  //       return next(
  //         new ApiError(
  //           "You should not send general colors while adding sizes.",
  //           400
  //         )
  //       );
  //     }

  //     if (product.colors) {
  //       if (deleteGeneralColors) {
  //         const seenColors = new Set();

  //         const hasDuplicate = deleteGeneralColors.some((color) => {
  //           if (seenColors.has(color)) return true;
  //           seenColors.add(color);
  //           return false;
  //         });

  //         if (hasDuplicate) {
  //           return next(
  //             new ApiError(
  //               "Duplicate colors found in deleteGeneralColors list.",
  //               400
  //             )
  //           );
  //         }

  //         // 1. التأكد من تطابق القيم
  //         const areColorsIdentical =
  //           deleteGeneralColors.colors.length === product.colors.length &&
  //           deleteGeneralColors.colors.every((color) =>
  //             product.colors.some(
  //               (productColor) => productColor.color === color
  //             )
  //           );

  //         if (!areColorsIdentical) {
  //           return next(
  //             new ApiError(
  //               "Colors to delete must match exactly the general product colors.",
  //               400
  //             )
  //           );
  //         }

  //         const session = await mongoose.startSession(); // بدء الجلسة مع قاعدة البيانات

  //         try {
  //           session.startTransaction(); // بداية المعاملة

  //           // 1. حذف الألوان العامة من المنتج
  //           product.colors = [];
  //           await product.save({ session });

  //           // 2. تحديث العربات
  //           const result = await Cart.updateMany(
  //             {
  //               "cartItems.product": product._id,
  //               "cartItems.color": { $in: deleteGeneralColors.colors },
  //             },
  //             {
  //               $set: {
  //                 "cartItems.$[elem].isAvailable": false,
  //               },
  //             },
  //             {
  //               arrayFilters: [
  //                 {
  //                   "elem.product": product._id,
  //                   "elem.color": { $in: deleteGeneralColors.colors },
  //                 },
  //               ],
  //               session,
  //             }
  //           );

  //           if (result.nModified === 0) {
  //             throw new Error(
  //               "حدث خطأ في تحديث بعض السلال. تم التراجع عن العملية."
  //             );
  //           }

  //           // 3.5 إضافة المقاسات الجديدة
  //           product.sizes = sizes;
  //           product.price = undefined;
  //           product.priceAfterDiscount = undefined;
  //           product.quantity = undefined;
  //           await product.save({ session });

  //           // 4. تأكيد التغييرات
  //           await session.commitTransaction();
  //           session.endSession();
  //         } catch (err) {
  //           await session.abortTransaction();
  //           session.endSession();

  //           return next(
  //             new ApiError(
  //               "حدث خطأ أثناء تحديث المنتج أو السلال، تم التراجع عن العملية.",
  //               500
  //             )
  //           );
  //         }
  //       } else {
  //         return next(
  //           new ApiError(
  //             "You cannot add sizes without deleting general colors.",
  //             400
  //           )
  //         );
  //       }
  //     }
  //   }

  //   if (colors) {
  //     // حالة إضافة ألوان بدون حذف
  //     if (quantity !== 0) {
  //       return next(
  //         new ApiError(
  //           "General quantity must be 0 when adding colors. It will be recalculated from colors' quantities.",
  //           400
  //         )
  //       );
  //     }

  //     if (deleteGeneralColors) {
  //       // حالة حذف ألوان
  //       const productColorValues = product.colors.map((c) => c.color);
  //       const colorsToDelete = deleteGeneralColors.colors;

  //       // التأكد أن كل الألوان المطلوبة للحذف موجودة فعلاً
  //       const allExist = colorsToDelete.every((color) =>
  //         productColorValues.includes(color)
  //       );
  //       if (!allExist) {
  //         return next(
  //           new ApiError(
  //             "Some colors you want to delete do not exist in the product.",
  //             400
  //           )
  //         );
  //       }

  //       if (colorsToDelete.length > product.colors.length) {
  //         return next(
  //           new ApiError(
  //             "You cannot delete more colors than what the product already has.",
  //             400
  //           )
  //         );
  //       }

  //       const session = await mongoose.startSession();
  //       try {
  //         session.startTransaction();

  //         // 1. حذف الألوان المطلوبة
  //         product.colors = product.colors.filter(
  //           (c) => !colorsToDelete.includes(c.color)
  //         );

  //         // 2. تعليم السلال بأن هذه الألوان لم تعد متاحة
  //         await Cart.updateMany(
  //           {
  //             "cartItems.product": product._id,
  //             "cartItems.color": { $in: colorsToDelete },
  //           },
  //           {
  //             $set: {
  //               "cartItems.$[elem].isAvailable": false,
  //             },
  //           },
  //           {
  //             arrayFilters: [
  //               {
  //                 "elem.product": product._id,
  //                 "elem.color": { $in: colorsToDelete },
  //               },
  //             ],
  //             session,
  //           }
  //         );

  //         // 3. إضافة الألوان الجديدة لو فيه
  //         if (colors.length > 0) {
  //           product.colors = [...product.colors, ...colors];
  //         }

  //         // 4. إعادة حساب الكمية العامة من كل الألوان
  //         const totalQty = product.colors.reduce(
  //           (sum, colorObj) => sum + (colorObj.quantity || 0),
  //           0
  //         );
  //         product.quantity = totalQty;

  //         // 5. حفظ التغييرات
  //         await product.save({ session });
  //         await session.commitTransaction();
  //         session.endSession();
  //       } catch (err) {
  //         await session.abortTransaction();
  //         session.endSession();
  //         return next(
  //           new ApiError(
  //             "An error occurred while updating colors or cart items. Changes reverted.",
  //             500
  //           )
  //         );
  //       }
  //     } else {
  //       // إضافة الألوان الجديدة على الألوان الحالية (إن وجدت)
  //       if (product.colors && product.colors.length > 0) {
  //         product.colors = [...product.colors, ...colors];
  //       } else {
  //         product.colors = colors;
  //       }

  //       // إعادة حساب الكمية العامة
  //       const totalQty = product.colors.reduce(
  //         (sum, colorObj) => sum + (colorObj.quantity || 0),
  //         0
  //       );
  //       product.quantity = totalQty;

  //       const session = await mongoose.startSession();
  //       try {
  //         session.startTransaction();

  //         // 1. تحديث المنتج
  //         await product.save({ session });

  //         // 2. تحديث السلال التي تحتوي على المنتج إذا كانت الألوان غير متاحة
  //         await Cart.updateMany(
  //           {
  //             "cartItems.product": product._id,
  //             "cartItems.color": { $exists: false },
  //           },
  //           {
  //             $set: {
  //               "cartItems.$[elem].isAvailable": false,
  //             },
  //           },
  //           {
  //             arrayFilters: [
  //               {
  //                 "elem.product": product._id,
  //                 "elem.color": { $exists: false },
  //               },
  //             ],
  //             session,
  //           }
  //         );

  //         // 3. تأكيد التغييرات
  //         await session.commitTransaction();
  //         session.endSession();
  //       } catch (err) {
  //         await session.abortTransaction();
  //         session.endSession();
  //         return next(
  //           new ApiError(
  //             "An error occurred while adding colors or updating cart items. Changes reverted.",
  //             500
  //           )
  //         );
  //       }
  //     }
  //   }
  // }