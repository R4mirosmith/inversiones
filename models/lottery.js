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