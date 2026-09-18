export async function createPixPayment(order: any) {

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/create-payment`,
    {
      method: "POST",
      headers:{
        "Content-Type":"application/json"
      },
      body: JSON.stringify({
        amount: order.total,
        description:"Pedido Loja",
        payer:{
          email: order.email
        }
      })
    }
  )


  if(!response.ok){
    throw new Error(
      "Erro ao criar pagamento Pix"
    )
  }


  return await response.json()
}
