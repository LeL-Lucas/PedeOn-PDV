import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { createClient } from
"https://esm.sh/@supabase/supabase-js@2"


const corsHeaders = {

  "Access-Control-Allow-Origin": "*",

  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",

}



Deno.serve(async (req) => {


  if (req.method === "OPTIONS") {

    return new Response(
      "ok",
      {
        headers: corsHeaders
      }
    )

  }



  try {


    const body =
      await req.json()


    console.log(
      "DADOS RECEBIDOS BRICK:",
      body
    )



    const accessToken =
      Deno.env.get("MP_ACCESS_TOKEN")



    if (!accessToken) {

      throw new Error(
        "MP_ACCESS_TOKEN ausente"
      )

    }



    const supabase =
      createClient(

        Deno.env.get("SUPABASE_URL")!,

        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

      )





    // ===================================
    // BUSCA MÉTODOS DISPONÍVEIS DA CONTA
    // ===================================


    const methodsResponse =
      await fetch(

        "https://api.mercadopago.com/v1/payment_methods",

        {

          headers: {

            Authorization:
              `Bearer ${accessToken}`

          }

        }

      )


    const methods =
      await methodsResponse.json()



    console.log(
      "MÉTODOS CARTÃO DISPONÍVEIS:",
      Array.isArray(methods)
      ? methods.filter(
          (m:any)=>
          m.payment_type_id === "credit_card"
        )
      : methods
    )






    // ===================================
    // MONTA PAGAMENTO
    // ===================================


    const pagamento:any = {


      transaction_amount:

        Number(
          body.transaction_amount
        ),



      description:

        "Pedido PedeOn",



      payment_method_id:

        body.payment_method_id,



      payer: {


        email:

          body.payer?.email ||

          "cliente@email.com",



        identification:

          body.payer?.identification

      },



      external_reference:

        body.order_id ||

        "PEDIDO-" + Date.now()


    }






    // CARTÃO

    if(body.token){


      pagamento.token =

        body.token



      pagamento.installments =

        Number(
          body.installments || 1
        )



      pagamento.issuer_id =

        Number(
          body.issuer_id
        )


    }







    console.log(
      "ENVIANDO PARA MERCADO PAGO:",
      pagamento
    )







    const response =

      await fetch(

        "https://api.mercadopago.com/v1/payments",

        {


          method:"POST",


          headers:{


            "Content-Type":

              "application/json",



            "Authorization":

              `Bearer ${accessToken}`,



            "X-Idempotency-Key":

              crypto.randomUUID()


          },


          body:

            JSON.stringify(
              pagamento
            )


        }

      )






    const result =

      await response.json()





    console.log(
      "RETORNO MERCADO PAGO:",
      result
    )







    if(!response.ok){


      return new Response(

        JSON.stringify(result),

        {


          status:
            response.status,


          headers:{

            ...corsHeaders,

            "Content-Type":
              "application/json"

          }


        }

      )


    }







    const {error} =

      await supabase

      .from("payments")

      .insert({


        mercado_pago_id:

          String(result.id),



        status:

          result.status,



        payment_method:

          result.payment_method_id,



        amount:

          result.transaction_amount,



        qr_code:

          result.point_of_interaction
          ?.transaction_data
          ?.qr_code,



        qr_code_base64:

          result.point_of_interaction
          ?.transaction_data
          ?.qr_code_base64


      })







    if(error){

      console.error(
        "ERRO SALVANDO PAGAMENTO:",
        error
      )

    }







    return new Response(

      JSON.stringify(result),

      {


        status:200,


        headers:{

          ...corsHeaders,

          "Content-Type":

            "application/json"

        }


      }

    )





  }

  catch(error){


    console.error(
      "ERRO GERAL:",
      error
    )



    return new Response(

      JSON.stringify({

        error:

          error instanceof Error

          ? error.message

          : "Erro desconhecido"

      }),

      {


        status:500,


        headers:{

          ...corsHeaders,

          "Content-Type":

            "application/json"

        }


      }

    )


  }


})
