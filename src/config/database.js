import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  // Garante que o ficheiro será sempre gravado na raiz do projeto
  storage: path.resolve(__dirname, '../../livraria.sqlite')
});

export const Livro = sequelize.define('Livro', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  titulo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  autor: {
    type: DataTypes.STRING,
    allowNull: false
  },
  preco: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  estoque: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});