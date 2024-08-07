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
router.put('/files/:id/unpublish', FilesController.unpublish);
router.get('/files/:id', FilesController.getShow);
router.get('/files', FilesController.getIndex);
router.put('/files/:id/publish', FilesController.putPublish);
router.put('/files/:id/unpublish', FilesController.putUnpublish);

export default router;