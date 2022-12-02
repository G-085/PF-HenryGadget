const { Router } = require('express');
const router = Router();

const { Product, Review, User } = require('../db.js');

router.get('/', async (req,res)=> {                                                     // localhost:3001/reviews (get)
    const {idProduct, idUser} = req.body;                                               // Atributos requeridos para busqueda por body

    try {
        if(!Object.keys(req.body).length) {                                             // En caso de que no nos pasen ningun parametro devolver todas las reviews
            const result = await Review.findAll();  
            
            result.length === 0                                                         // Si no hay reviews disponibles devolvera un array vacio, se valida y muestra msg apropiado, misma logica aplica para todos los casos
            ? res.status(404).json({msg: "There are no reviews available"})
            : res.status(200).json(result);
            return
        }

        if(!idUser) {                                                                   // Si no hay idUser habra idProduct si llego hasta aca, en ese caso devolver reviews filtradas por producto.
            const result = await Review.findAll({where:{productId: idProduct}});
            
            result.length === 0
            ? res.status(404).json({msg: "There are no reviews available for this product or the product doesn't exist"})
            : res.status(200).json(result);
            return
        }

        const result = await Review.findAll({where: {userId: idUser}});                 // Ya la ultima situacion posible es el idUser, en ese caso devolver reviews filtradas por usuario.
        result.length === 0
        ? res.status(404).json({msg: "There are no reviews available for this user or the user doesn't exist"})
        : res.status(200).json(result);
    } catch (error) {
        res.status(400).json({err: error.message});
    }
})




router.post('/', async (req,res) => {                                                           // localhost:3001/reviews (post)
    const {idProduct, idUser, reviewData} = req.body;                                           // Information recibida por body, id de usuario y product y un objeto de review, que tendra *score y comment los nombres de las propiedades de reviewData deben ser extrictamente esos
    const reviewDataValidate = reviewData || false;                                             // Validacion en caso de que reviewData sea null, evitar que rompa el servidor

    if(!idProduct || !idUser) return res.status(400).json({err: 'Missing data'});               // Si falta algun id devuelve un error.
    if(!reviewDataValidate) return res.status(400).json({err: 'Review data is missing'});       // Revisa que si hayan pasado ReviewData
    if(!reviewDataValidate.score) return res.status(400).json({err: 'Review score is missing'});// Revisa que reviewData tenga la propiedad score, comments es opcional
    
    try {
        const product = await Product.findByPk(idProduct);                                       // Encuentra el product por ID
        const user = await User.findByPk(idUser);                                                // Encuentra el usuario por ID
        const review = await Review.create(reviewDataValidate);                                  // Crea una review con la data recibida por body en reviewData
        
        await user.addReview(review);                                                            // Linkeamos tanto en usuario y product la nueva review
        await product.addReview(review);

        res.status(201).json({msg: 'review created succesfully', review: review});
    } catch (error) {
        res.status(404).json({err: "user or product doesn't exist"});
    }
})

module.exports = router;