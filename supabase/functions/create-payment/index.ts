import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { createClient } from
"https://esm.sh/@supabase/supabase-js@2"


const corsHeaders = {

  "Access-Control-Allow-Origin": "*",

  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",

}



Deno.serve(async (req)=>{


  if(req.method === "OPTIONS"){

    return new Response("ok",{
      headers:corsHeaders
    })

  }



  try {


    const body =
      await req.json()


    console.log(
      "Dados recebidos:",
      body
    )



    const accessToken =
      Deno.env.get(
        "MP_ACCESS_TOKEN"
      )



    const supabase =
      createClient(

        Deno.env.get(
          "SUPABASE_URL"
        )!,

        Deno.env.get(
          "SUPABASE_SERVICE_ROLE_KEY"
        )!

      )



    const pagamento = {


      transaction_amount:
        Number(body.transaction_amount),


      description:
        "Pedido PedeOn",


      payment_method_id:
        "pix",


      payer:{

        email:
          body.email ||
          "cliente@email.com"

      },


      external_reference:

        body.order_id ||
        "PEDIDO-" + Date.now()


    }



    console.log(
      "Enviando Mercado Pago:",
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
            JSON.stringify(pagamento)


        }

      )



    const result =
      await response.json()



    console.log(
      "Resposta Mercado Pago:",
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



    // SALVAR PAGAMENTO NO BANCO

    const {error} =
      await supabase

      .from("payments")

      .insert({

        order_id:

          body.order_id || null,


        mercado_pago_id:

          String(result.id),


        status:

          result.status,


        payment_method:

          "pix",


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
        "Erro salvando pagamento:",
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
      "Erro:",
      error
    )


    return new Response(

      JSON.stringify({

        error:
          error.message

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
