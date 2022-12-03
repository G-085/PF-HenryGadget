const { Router } = require('express');
const router = Router();

const { User, Address } = require('../db.js');

router.get('/', async(req,res) => {                                             // localhost:3001/address (get)
    const {idUser} = req.body;                                                  // Requiere user id para buscar las direcciones de un usuario en especifico

    if(!idUser) return res.status(400).json({err: 'No user id was provided'});  // Muestra un mensaje apropiado en caso de que no pasen ningun ID

    try {
        const user = await User.findByPk(idUser, {include: Address});           // Buscamos el usuario por id incluyendo sus address.
        const address = user.addresses;                                         // desde la base de datos normalzia el nombre como addresses, nada mas una pequeña correcion para darle el nombre correct

        res.status(200).send(address);
    } catch (error) {
        res.status(400).json({err: 'Si hay error'});
    }
})

router.post('/', async(req,res) => {                                                                                                // localhost:3001/address (post)
    const {idUser, address} = req.body;                                                                                             // Requerimos usuario y la direccion como objeto por body
    const addressValidate = address || false;                                                                                       // Pequeño short circuit para evitar que si no pasan el address rompa el servidor

    if(!idUser) return res.status(404).json({err: "User id is missing"});                                                           // Validaciones en caso de que falte algun dato y devuelve un msg apropiado
    if(!addressValidate.street || !addressValidate.city || !addressValidate. region || !addressValidate.postalCode){
        return res.status(404).json({err: "Important information is missing from address as street, city, region or postal code"});
    };

    try {
        const user = await User.findByPk(idUser);                                                                                   // Encontramos el usuario por id al cual le queremos agregar la direccion

        if(!user){                                                                                                                  // Si el usuario no existe no creamos nada y devolvemos msg de error apropiado
            return res.status(404).json({msg: `The user ${idUser} provided doesn't exist`})
        }

        const newAddress = await Address.create(addressValidate);                                                                   // Vinculacion de address con el usuario.
        const result = await user.addAddress(newAddress);
        
        res.status(201).json({msg: "Address created successfully", address: result});
    } catch (error) {
        res.status(400).json({msg: `The user ${idUser} provided doesn't exist`, error});
    }
})

module.exports = router