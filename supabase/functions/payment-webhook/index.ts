import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { createClient } from
"https://esm.sh/@supabase/supabase-js@2"


console.log("payment-webhook iniciado")


Deno.serve(async (req) => {

  try {

    const body = await req.json()


    console.log(
      "Webhook Mercado Pago:",
      body
    )


    const paymentId =
      body?.data?.id


    if (!paymentId) {

      console.log(
        "Sem ID de pagamento"
      )


      return new Response(
        "OK",
        {
          status: 200
        }
      )

    }



    const accessToken =
      Deno.env.get(
        "MP_ACCESS_TOKEN"
      )



    if (!accessToken) {

      throw new Error(
        "MP_ACCESS_TOKEN ausente"
      )

    }



    // CONSULTA PAGAMENTO NO MERCADO PAGO

    const mpResponse =
      await fetch(

        `https://api.mercadopago.com/v1/payments/${paymentId}`,

        {

          headers: {

            Authorization:
              `Bearer ${accessToken}`

          }

        }

      )



    const payment =
      await mpResponse.json()



    console.log(
      "Pagamento Mercado Pago:",
      payment
    )



    if (!mpResponse.ok) {

      return new Response(

        JSON.stringify(payment),

        {

          status: 400,

          headers: {

            "Content-Type":
              "application/json"

          }

        }

      )

    }



    // CONECTA SUPABASE

    const supabase =
      createClient(

        Deno.env.get(
          "SUPABASE_URL"
        )!,

        Deno.env.get(
          "SUPABASE_SERVICE_ROLE_KEY"
        )!

      )




    // ATUALIZA PAGAMENTO

    const { error: paymentError } =
      await supabase

        .from("payments")

        .update({

          status:
            payment.status,

          qr_code:
            payment.point_of_interaction
              ?.transaction_data
              ?.qr_code,

          qr_code_base64:
            payment.point_of_interaction
              ?.transaction_data
              ?.qr_code_base64,

          updated_at:
            new Date()

        })

        .eq(

          "mercado_pago_id",

          String(paymentId)

        )



    if (paymentError) {

      console.error(
        "Erro ao atualizar pagamento:",
        paymentError
      )

      throw paymentError

    }



    console.log(
      "Pagamento atualizado com sucesso"
    )




    // =====================================
    // LIBERA PEDIDO APÓS PAGAMENTO APROVADO
    // =====================================


    if (payment.status === "approved") {


      const { error: orderError } =

        await supabase

          .from("orders")

          .update({

            status:
              "recebido"

          })

          .eq(

            "mercado_pago_id",

            String(paymentId)

          )



      if (orderError) {

        console.error(

          "Erro ao atualizar pedido:",

          orderError

        )

      } else {

        console.log(

          "Pedido liberado para produção"

        )

      }


    }



    return new Response(

      JSON.stringify({

        success: true,

        status:
          payment.status

      }),

      {

        headers: {

          "Content-Type":
            "application/json"

        }

      }

    )



  }

  catch(error) {


    console.error(

      "Erro webhook:",

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

        status: 500,

        headers: {

          "Content-Type":
            "application/json"

        }

      }

    )


  }


})
