import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const sequelize = new Sequelize({
  dialect: 'sqlite',

  storage: path.resolve(__dirname, '../../livraria.sqlite')
});

export const Livro = sequelize.define('Livro', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  titulo: { type: DataTypes.STRING, allowNull: false },
  autor: { type: DataTypes.STRING, allowNull: false },
  editora: { type: DataTypes.STRING, allowNull: true },
  categoria: { type: DataTypes.STRING, allowNull: true },
  ano: { type: DataTypes.INTEGER, allowNull: true },
  preco: { type: DataTypes.FLOAT, defaultValue: 0 },
  estoque: { type: DataTypes.INTEGER, defaultValue: 1 },
  capa: { type: DataTypes.TEXT, allowNull: true }, 
  descricao: { type: DataTypes.TEXT, allowNull: true }
});