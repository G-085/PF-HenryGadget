const { Router } = require('express');
const router = Router();

const { User, Review } = require('../db.js');
const { Sequelize } = require("sequelize");


router.get('/', async (req, res) => {
    try {
        const { rol, limit, offset } = req.query;
        const condition = {};
        let where = {};

        if (rol) {
            where.rol = {[Sequelize.Op.iLike]: `%${rol}%`}
        }
        condition.where = where;
        condition.include = Review;

        if (limit && offset) {
            condition.limit =  limit;
            condition.offset =  offset;
        }

        const users = await User.findAll(condition);
        res.status(200).json({msg: 'User obtained successfully.', result: users});

    } catch (error) {
        res.status(400).json({err: error.message})
    }
})

router.get('/:uid', async (req, res) => {
    try {
        const {uid} = req.params;
        const user = await User.findOne({where: {uid}});
        if (user === null) {
            return res.status(400).json({err: `The enter uid does not exist`})
        }
        res.status(200).json({msg: 'User successfully obtained.', result: user});
    } catch (error) {
        res.status(400).json({err: error.message})
    }
})

router.post('/', async (req,res) => {
    try {
        const {uid, rol} = req.body;

        let newUser = await User.create({uid, rol});
        res.status(201).json({msg: 'User created correctly.', result: newUser})
    } catch (error) {
        res.status(400).json({err: error.message})
    }
})

router.delete('/:uid', async (req, res) => {
    try {
        const { uid } = req.params;

        const userToDelete = await User.findOne({where: {uid}});

        if (userToDelete === null) {
            return res.status(400).json({err: `The user with id: ${id} does not exits.`})
        }
        await User.destroy({
            where: {uid}
        });
        res.json({msg: `The user has been deleted.`, result: userToDelete})
    } catch (error) {
        res.status(400).json({err: error.message})
    }
})

router.put('/:uid', async (req, res) => {
    try {
        const {uid} = req.params;

        const user = await User.findOne({where: {uid}});
        if (user === null) {
            return res.status(400).json({err: `Does not exist users with the enter uid.`})
        }
        const {rol} = req.body;
        await user.update({rol},{where: {uid}})
        res.status(200).json({msg: 'User has been updated.'})

    } catch (error) {
        if (error.parent.detail) {
            return res.status(400).json({err: error.parent.detail});
        }
        res.status(400).json({err: error.message});
    }
})

module.exports = router;