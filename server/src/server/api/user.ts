import express from 'express';
import fs from 'fs';

import MessageResponse from '../interfaces/MessageResponse';

const userRouter = express.Router();

/**
 * Method: GET
 * Endpoint: /api/v1/user/
 * - Gets a list of users
 */
userRouter.get<{}, MessageResponse>('/', (req, res) => {

  let all_users = [];
  let user_list = fs.readdirSync(`${__dirname}/../data/users/`);
  for (let i = 0; i < user_list.length; i++) {
    const user_filename = user_list[i];

    const user_raw = fs.readFileSync(`${__dirname}/../data/users/${user_filename}`, 'utf-8');
    if (!user_raw) {
      continue;
    }

    const user = JSON.parse(user_raw);
    if (!user) {
      continue;
    }

    delete user.sections;

    all_users.push(user)
  }

  res.json(all_users);
});

/**
 * Method: GET
 * Endpoint: /api/v1/user/:id
 * - Gets the user JSON based on the :id
 */
userRouter.get<{}, MessageResponse>('/:id', (req, res) => {

  let { id } = req.params as { id: number };
  let raw_data = fs.readFileSync(`${__dirname}/../data/users/${id}.json`, 'utf-8');
  let json_data = JSON.parse(raw_data);

  res.json(json_data);
});

export default userRouter;
