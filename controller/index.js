'use strict';

const express = require('express');
const router = express.Router();

// Externalized the business logic for each route.
const roboController = require('./roboController');

// Routes that can be accessed by any one

/**
 * @api {post} /login Authentication
 * @apiGroup General
 * 
 * @apiParamExample {json} Request-Example:
 * {
 *    "username":"any-username",
 *    "password":"any-password"
 * }
 * 
 * @apiSuccessExample Success-Response:
 * {
 *    "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
 *    "expiresIn": 1531936602893,
 *    "tokenType": "bearer"
 * }
 * 
 */
//router.post('/login', authController.login);

// Routes that can be accessed only by autheticated users

/**
 * @api {get} /api/v1/product Get all products
 * @apiGroup Product
 * 
 * @apiSuccessExample Success-Response:
 * [
 *     {
 *         "name": "Product Name",
 *         "description": "Product Description",
 *         "quantity": 100,
 *         "id": "708303a0-89f4-11e8-b3e3-c7a13cf0f3f4",
 *     },
 *     {
 *         "name": "Product Name",
 *         "description": "Product Description",
 *         "quantity": 2,
 *         "id": "76d9f060-89f4-11e8-b3e3-c7a13cf0f3f4",
 *     }
 * ]
 * .get('/find/:startDate/:endDate/:status', (req, res)
 */
router.get('/find/:startDate/:endDate/:status', roboController.getRecords);

/**
 * @api {get} /api/v1/product/:id Get product by id
 * @apiGroup Product
 * 
 * @apiSuccessExample Success-Response:
 * {
 *     "name": "Product Name",
 *     "description": "Product Description",
 *     "quantity": 2,
 *     "id": "76d9f060-89f4-11e8-b3e3-c7a13cf0f3f4",
 * }
 * 
 */
// router.get('/api/v1/product/:id', productController.getOne);
// router.post('/api/v1/product/', productController.create);
// router.put('/api/v1/product/:id', productController.update);
// router.delete('/api/v1/product/:id', productController.delete);

module.exports = router;