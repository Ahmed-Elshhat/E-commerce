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

                          if (item.color != null) {
                            if (product.colors.length === 0) {
                              shouldUpdateCart = false;
                            } else if (product.colors.length > 0) {
                              const colorIsExist = product.colors.find(
                                (c) => c.color.toLowerCase() === item.color.toLowerCase()
                              );
          
                              if (colorIsExist) {
                                item.isAvailable = true;
                                item.color = colorIsExist.color;
                                item.quantity = Math.min(
                                  item.quantity,
                                  colorIsExist.quantity
                                );
                                shouldUpdateCart = true;
                              }
                            }
                          } else if (
                            quantity !== item.quantity ||
                            (priceAfterDiscount != null
                              ? priceAfterDiscount
                              : price) !== item.price
                          ) {
                            item.isAvailable = true;
                            shouldUpdateCart = true;
          
                            if (quantity !== item.quantity) {
                              item.quantity = quantity;
                            }
          
                            if (
                              (priceAfterDiscount != null
                                ? priceAfterDiscount
                                : price) !== item.price
                            ) {
                              item.price =
                                priceAfterDiscount != null
                                  ? priceAfterDiscount
                                  : price;
                            }
                          }