var db = require('../db/db.js');
exports.create = async (body) => {
    let numbers = body.number;
    const promisePool = db.get().promise();
    
    // Usamos un bucle for...of para iterar y esperar cada operación asincrónica
    for (let number of numbers) {
        try {
            // Esperamos a que la consulta se complete antes de continuar con el siguiente número
            await promisePool.query('CALL sp_insert_number_lottery(?,?,?,?,?,?)', [
                body.name, 
                body.phone, 
                body.email, 
                body.lottery_id, 
                number, 
                body.payment_id
            ]);
        } catch (error) {
            console.error("Error al insertar el número", number, error);
            return { success: false, message: `Hubo un error al insertar el número ${number}.` };
        }
    }
    return { success: true, message: 'Todos los números fueron insertados correctamente.' };
};





exports.getAll = (page,limit) => {
    // query database using promises
    const promisePool = db.get().promise();
    return promisePool.query('CALL sp_GetAllPurchasedNumbers()',  [page,limit]);
}
exports.getlistNumbersApproved = (numbers) => {
    // query database using promises
    const promisePool = db.get().promise();
    return promisePool.query('CALL sp_GetNumberPurchasesByPayments(?)',  [numbers]);
}


exports.getAllPerson = (page,limit) => {
    // query database using promises
    const promisePool = db.get().promise();
    return promisePool.query('CALL sp_GetPersonsByNumberState()',  [page,limit]);
}


const axios = require('axios');

exports.checkAndUpdatePayments = async () => {
    const promisePool = db.get().promise();
    
    try {
        // 1. Obtener todos los números comprados
        const [[numbers]] = await promisePool.query('CALL sp_GetAllPurchasedNumbers()', []);
        
        // 2. Iterar sobre cada número comprado
        for (const number of numbers) {
            const { id_payment } = number;
            console.log(number,"number");
        console.log(id_payment,"id_payment");
            // 3. Consultar el estado del pago en Mercado Pago
            const url = `https://api.mercadopago.com/v1/payments/search?criteria=desc&id=${id_payment}`;
            const headers = {
                Authorization: `Bearer APP_USR-1982257925213143-090321-3a3945505bbc4ca2a56a702358765802-1955976988`,  // Usa tu token de acceso de Mercado Pago
            };
            
            try {
                // 4. Hacer la solicitud para obtener el estado del pago
                const response = await axios.get(url, { headers });
                const payment = response.data.results[0];
                console.log(payment,"1");
                if (payment) {
                    const { status, status_detail } = payment;
                    console.log(payment);
                    // 5. Verificar si el estado no es 'approved' o 'accredited'
                    if (status !== "approved" && status !== "pending") {
                        // 6. Llamar al SP para actualizar el estado
                        await promisePool.query('CALL sp_updateNumberPurchasedState(?)', [id_payment]);
                        console.log(`Estado actualizado para el pago ${id_payment}`);
                    } else {
                        console.log(`El pago ${id_payment} está aprobado y acreditado.`);
                    }
                } else {
                    console.log(`No se encontraron datos de pago para el ID ${id_payment}`);
                }
            } catch (error) {
                console.error(`Error al consultar el estado del pago ${id_payment}:`, error);
            }
        }
    } catch (error) {
        console.error('Error al obtener los números comprados:', error);
    }
};
