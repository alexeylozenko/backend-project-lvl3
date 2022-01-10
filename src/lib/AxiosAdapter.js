import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http.js';

export default axios.create({ adapter: httpAdapter });
