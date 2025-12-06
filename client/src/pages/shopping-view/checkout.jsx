import Address from "@/components/shopping-view/address";
import img from "../../assets/account.jpg";
import { useDispatch, useSelector } from "react-redux";
import UserCartItemsContent from "@/components/shopping-view/cart-items-content";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { createNewOrder, capturePayment } from "@/store/shop/order-slice";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function ShoppingCheckout() {
  const { cartItems } = useSelector((state) => state.shopCart);
  const { user } = useSelector((state) => state.auth);
  const [currentSelectedAddress, setCurrentSelectedAddress] = useState(null);
  const [isPaymentStart, setIsPaymemntStart] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const dispatch = useDispatch();
  const { toast } = useToast();
  const navigate = useNavigate();

  console.log(currentSelectedAddress, "cartItems");

  const totalCartAmount =
    cartItems && cartItems.items && cartItems.items.length > 0
      ? cartItems.items.reduce(
        (sum, currentItem) =>
          sum +
          (currentItem?.salePrice > 0
            ? currentItem?.salePrice
            : currentItem?.price) *
          currentItem?.quantity,
        0
      )
      : 0;

  function handleInitiatePayment() {
    if (cartItems.length === 0) {
      toast({
        title: "Your cart is empty. Please add items to proceed",
        variant: "destructive",
      });

      return;
    }
    if (currentSelectedAddress === null) {
      toast({
        title: "Please select one address to proceed.",
        variant: "destructive",
      });

      return;
    }

    const orderData = {
      userId: user?.id,
      cartId: cartItems?._id,
      cartItems: cartItems.items.map((singleCartItem) => ({
        productId: singleCartItem?.productId,
        title: singleCartItem?.title,
        image: singleCartItem?.image,
        price:
          singleCartItem?.salePrice > 0
            ? singleCartItem?.salePrice
            : singleCartItem?.price,
        quantity: singleCartItem?.quantity,
      })),
      addressInfo: {
        addressId: currentSelectedAddress?._id,
        address: currentSelectedAddress?.address,
        city: currentSelectedAddress?.city,
        pincode: currentSelectedAddress?.pincode,
        phone: currentSelectedAddress?.phone,
        notes: currentSelectedAddress?.notes,
      },
      orderStatus: "pending",
      paymentMethod: "demo",
      paymentStatus: "pending",
      totalAmount: totalCartAmount,
      orderDate: new Date(),
      orderUpdateDate: new Date(),
      paymentId: "",
      payerId: "",
    };

    dispatch(createNewOrder(orderData)).then((data) => {
      console.log(data, "order created");
      if (data?.payload?.success) {
        setIsPaymemntStart(true);
        const orderId = data.payload.orderId;
        // Automatically capture payment (demo payment)
        dispatch(capturePayment({ orderId })).then((captureData) => {
          if (captureData?.payload?.success) {
            setIsPaymemntStart(false);
            sessionStorage.removeItem("currentOrderId");
            navigate("/shop/payment-success");
          }
        });
      } else {
        setIsPaymemntStart(false);
      }
    });
  }

  return (
    <div className="flex flex-col">
      <div className="relative h-[300px] w-full overflow-hidden">
        <img src={img} className="h-full w-full object-cover object-center" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5 p-5">
        <Address
          selectedId={currentSelectedAddress}
          setCurrentSelectedAddress={setCurrentSelectedAddress}
        />
        <div className="flex flex-col gap-4">
          {cartItems && cartItems.items && cartItems.items.length > 0
            ? cartItems.items.map((item) => (
              <UserCartItemsContent cartItem={item} />
            ))
            : null}
          <div className="mt-8 space-y-4">
            <div className="flex justify-between">
              <span className="font-bold">Total</span>
              <span className="font-bold">${totalCartAmount}</span>
            </div>
          </div>
          <div className="mt-4 w-full space-y-2">
            <Button onClick={handleInitiatePayment} className="w-full">
              {isPaymentStart
                ? "Processing Payment..."
                : "Place Order"}
            </Button>
            <Button
              onClick={() => setShowQRModal(true)}
              variant="outline"
              className="w-full"
            >
              Pay using QR Code
            </Button>
          </div>
        </div>
      </div>

      {/* QR Code Payment Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan QR Code to Pay</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <img
              src="/qr-code.png"
              alt="QR Code for Payment"
              className="w-64 h-64 border-2 border-gray-300 rounded-lg"
            />
            <p className="text-sm text-gray-500 text-center">
              Scan this QR code with your UPI app to complete payment
            </p>
            <p className="text-xs text-gray-400 text-center">
              Amount: ${totalCartAmount}
            </p>
            <Button onClick={() => setShowQRModal(false)} className="w-full mt-4">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ShoppingCheckout;
