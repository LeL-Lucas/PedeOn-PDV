import { ref } from "vue"
import { createPixPayment } from "@/services/mercadopago"


export function usePayment(){

 const pix = ref<any>(null)
 const loading = ref(false)


 async function generatePix(order:any){

   loading.value=true

   try{

    const result =
      await createPixPayment(order)


    const data =
      result.point_of_interaction
      ?.transaction_data


    if(!data){
      throw new Error(
       "QR Code não retornado"
      )
    }


    pix.value={
      qrCode:data.qr_code,
      qrCodeBase64:data.qr_code_base64
    }


   }finally{

    loading.value=false

   }

 }


 return{
   pix,
   loading,
   generatePix
 }

}
