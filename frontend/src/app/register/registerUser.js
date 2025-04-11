export default async function registerUser(formData){
    const email = formData.get("email");
    const pw = formData.get("pw");
    const body_msg = JSON.stringify({
        email: email,
        password: pw
    })

    const res = await fetch(process.env.NEXT_PUBLIC_API_ENDPOINT+'/api/register', 
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: body_msg,
        }
    );
    return res.json();
}