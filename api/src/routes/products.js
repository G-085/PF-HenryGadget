const { Router } = require('express');
const router = Router();

const { Product, Review, Brand, Storage, Type, Ram } = require('../db.js');
const { Sequelize } = require("sequelize");

const getDifferencesArray = require('./controllers/getDifferencesArray.js');
const sortByPrice = require('./controllers/sortByPrice.js');
const sortByBrand = require('./controllers/sortByBrand.js');
const arrayIsNotNumbers = require('./controllers/arrayIsNotNumbers.js');
const orderArrayNumbers = require('./controllers/orderArrayNumbers.js');

router.get('/', async (req, res) => {
    const { name, brand, type, limit, offset, sortPrice, sortBrand, ram, storage } = req.query;
    let { limitPrice } = req.body;
    const listQueries = ['name', 'brand', 'type', 'limit', 'offset', 'sortPrice', 'sortBrand', 'ram', 'storage'];

    ////// Checkeo de datos entrantes. En su momento mocularizar.
    if (getDifferencesArray(Object.getOwnPropertyNames(req.query), listQueries).length !== 0)
        return res.status(400).json({ err: 'Bad query.' });

    // Se chequea que se reciban solo opciones válidas
    if (sortPrice && !(sortPrice === 'Lower prices' || sortPrice === 'Higher prices'))
        return res.status(400).json({ err: 'Bad option in query sortPrice.' });

    if (sortBrand && !(sortBrand === 'up' || sortBrand === 'down'))
        return res.status(400).json({ err: 'Bad option in query sortBrand.' });

    if (limitPrice && limitPrice.length !== 0) {
        if (limitPrice.length > 2)
            return res.status(400).json({ err: 'Only two items are allowed.' });

        limitPrice = arrayIsNotNumbers(limitPrice);
        if (!limitPrice)
            return res.status(400).json({ err: 'One of the items is invalid.' });

        limitPrice = orderArrayNumbers(limitPrice);
    }
    //////

    try {
        let condition = {
            include: [
                { model: Brand }, // include[0]
                { model: Type }, // include[1]
                { model: Storage }, // include[2]
                { model: Review }, // include[3]
                { model: Ram } // include[4]
            ]
        };

        let where = {};

        if (name) {
            where.name = { [Sequelize.Op.iLike]: `%${name}%` }
        }
        if (brand) {
            condition.include[0].where = { name: { [Sequelize.Op.iLike]: `${brand}` } }
        }
        if (type) {
            condition.include[1].where = { name: { [Sequelize.Op.iLike]: `${type}` } }
        }
        if (storage) {
            condition.include[2].where = { size: { [Sequelize.Op.iLike]: `${storage}` } }
        }
        if (ram) {
            condition.include[4].where = { size: { [Sequelize.Op.iLike]: `${ram}` } }
        }
        if (limitPrice && limitPrice.length !== 0) {
            where.price = { [Sequelize.Op.between]: [limitPrice[0], limitPrice[1]] }
        }
        condition.where = where;

        // Se calcula la cantidad total de elementos
        const total = (await Product.findAll(condition)).length;

        if (limit && offset) {
            condition.limit = limit;
            condition.offset = offset;
        }

        let products = await Product.findAll(condition);
        // Convertir array en objetos sin metadata.
        products = products.map(el => el.get({ plain: true }))

        // SortPrice up o down
        if (sortPrice)
            products = sortByPrice(products, sortPrice);

        // sortBrand up o down
        if (sortBrand)
            products = sortByBrand(products, sortBrand);

        res.status(200).json({ msg: 'Products obtained successfully.', result: products, total });

    } catch (error) {
        res.status(400).json({ err: 'Product not found.' })
    }
})



router.get('/allProducts', async (req, res) => {
    const { name,  limit, offset, deleted } = req.query;
    const listQueries = ['name', 'limit', 'offset', 'deleted'];

    if (getDifferencesArray(Object.getOwnPropertyNames(req.query), listQueries).length !== 0)
        return res.status(400).json({ err: 'Bad query.' });

    try {
        let condition = {
            include: [
                { model: Brand }, // include[0]
                { model: Type }, // include[1]
                { model: Storage }, // include[2]
                { model: Review }, // include[3]
                { model: Ram } // include[4]
            ]
        };

        let where = {};

        if (name) where.name = { [Sequelize.Op.iLike]: `%${name}%` }

        if (deleted)  where.deletedAt = { [Sequelize.Op.not]: null }

        condition.where = where;
        condition.paranoid = false;

        const total = (await Product.findAll(condition)).length;

        if (limit && offset) {
            condition.limit = limit;
            condition.offset = offset;
        }

        const allProducts = await Product.findAll(condition);
        res.status(200).json({ msg: 'Products obtained successfully.', result: allProducts, total });
    } catch (error) {
        res.status(400).json({ err: error })
    }
})

router.get('/type', async (req, res) => {
    try {
        const types = await Type.findAll();
        res.status(200).json({ msg: 'List of types.', result: types });
    } catch (error) {
        res.status(400).json({ err: error })
    }
})

router.get('/brand', async (req, res) => {
    try {
        const brands = await Brand.findAll();
        res.status(200).json({ msg: 'List of brand availables', result: brands });
    } catch (error) {
        res.status(400).json({ err: error })
    }
})

router.get('/storage', async (req, res) => {
    try {
        const storages = await Storage.findAll();
        res.status(200).json({ msg: 'List of storage availables', result: storages });
    } catch (error) {
        res.status(400).json({ err: error })
    }
})

router.get('/ram', async (req, res) => {
    try {
        const rams = await Ram.findAll();
        res.status(200).json({ msg: 'List of RAM availables', result: rams });
    } catch (error) {
        res.status(400).json({ err: error })
    }
})

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let condition = {
            where: { id: id },
            include: [
                { model: Brand },
                { model: Type },
                { model: Storage },
                { model: Review },
                { model: Ram }
            ]
        };

        const product = await Product.findOne(condition);
        if (product === null) {
            return res.status(400).json({ err: `The enter id does not exist.` })
        }
        res.status(200).json({ msg: 'Product obtained successfully.', result: product });
    } catch (error) {
        res.status(400).json({ err: error.message })
    }
})

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const productToDelete = await Product.findByPk(id);
        if (productToDelete === null) {
            return res.status(400).json({ err: `The product with id: ${id} does not exits.` });
        }
        await Product.destroy({
            where: {
                id: id
            }
        });
        res.json({ msg: `The product with the name ${productToDelete.name} has been deleted.` })
    } catch (error) {
        res.status(400).json({ err: error.message })
    }
})

router.post('/', async (req, res) => {
    const product = req.body;
    const { name, price, model, stock, type, brand, storage, img, ram } = req.body;
    if (!name || !model || !price || !stock || !type || !brand || !img)
        return res.status(400).json({ err: "Important information is missing from product." })

    try {
        let productCreated = await Product.create(product);

        const [typeOfDevice, typeCreated] = await Type.findOrCreate({
            where: { name: type }
        });
        await productCreated.setType(typeOfDevice);

        const [brandOfDevice, brandCreated] = await Brand.findOrCreate({
            where: { name: brand }
        });
        await productCreated.setBrand(brandOfDevice);

        if (storage) {
            const [storageOfDevice, storageCreated] = await Storage.findOrCreate({
                where: { size: storage }
            })
            await productCreated.setStorage(storageOfDevice);
        }
        if (ram) {
            const [ramOfDevice, ramCreated] = await Ram.findOrCreate({
                where: { size: ram }
            })
            await productCreated.setRam(ramOfDevice);
        }

        res.status(201).json({ msg: 'Product added correctly.', result: productCreated })
    } catch (error) {
        res.status(400).json({ err: error.message })
    }
})

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findOne({where: {id}});

        if (product === null)
        return res.status(400).json({ err: `The enter id does not exist.` })

        const { type, brand, storage, ram } = req.body;
        if (type) {
            const [typeOfDevice, typeCreated] = await Type.findOrCreate({
                where: { name: type }
            });
            await product.setType(typeOfDevice);
        }
        if (brand) {
            const [brandOfDevice, brandCreated] = await Brand.findOrCreate({
                where: { name: brand }
            });
            await product.setBrand(brandOfDevice);
        }
        if (storage) {
            const [storageOfDevice, storageCreated] = await Storage.findOrCreate({
                where: { size: storage }
            })
            await product.setStorage(storageOfDevice);
        }
        if (ram) {
            const [ramOfDevice] = await Ram.findOrCreate({
                where: { size: ram }
            })
            await product.setRam(ramOfDevice);
        }

        await Product.update(req.body, {where: {id}})
        res.status(200).json({ msg: 'Updated.' })

    } catch (error) {
        res.status(400).json({ err: error.message });
    }
})

module.exports = router;
