import express from 'express';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import AppController from '../controllers/AppController';
import FilesController from '../controllers/FilesController';

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew);
router.get('/connect', AuthController.connect);
router.get('/disconnect', AuthController.disconnect);
router.get('/users/me', UsersController.getMe);
router.post('/files/', FilesController.postUpload);

export default router;