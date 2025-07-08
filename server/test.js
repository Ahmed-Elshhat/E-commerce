          // if (size.newSizeName) {
          //   const originalCartCount = await Cart.countDocuments({
          //     "cartItems.product": product._id,
          //     "cartItems.size": size.sizeName,
          //   });

          //   let updatedCartCount = 0;

          //   const result = await Cart.updateMany(
          //     {
          //       "cartItems.product": product._id,
          //       "cartItems.size": size.sizeName,
          //     },
          //     {
          //       $set: {
          //         "cartItems.$[elem].isAvailable": false,
          //       },
          //     },
          //     {
          //       arrayFilters: [
          //         {
          //           "elem.product": product._id,
          //           "elem.size": size.sizeName,
          //         },
          //       ],
          //       session,
          //     }
          //   );

          //   if (result.modifiedCount > 0) {
          //     updatedCartCount += result.modifiedCount;
          //   }

          //   if (updatedCartCount < originalCartCount) {
          //     throw new ApiError(
          //       "Not all carts were updated. Transaction rolled back.",
          //       400
          //     );
          //   }

          //   const affectedCarts = await Cart.find({
          //     "cartItems.product": product._id,
          //     "cartItems.size": size.sizeName,
          //   }).session(session);

          //   await Promise.all(
          //     affectedCarts.map(async (cart) => {
          //       calcTotalCartPrice(cart);
          //       await cart.save({ session });
          //     })
          //   );

          //   product.sizes.forEach((productSize) => {
          //     if (
          //       productSize.size.toLowerCase() === size.sizeName.toLowerCase()
          //     ) {
          //       productSize.size = size.newSizeName;
          //     }
          //   });
          // }