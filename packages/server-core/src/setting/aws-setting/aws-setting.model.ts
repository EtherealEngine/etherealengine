import { DataTypes, Sequelize, Model } from 'sequelize'
import { Application } from '../../../declarations'
import { AwsInterface } from '@xrengine/common/src/dbmodels/Aws'

export default (app: Application) => {
  const sequelizeClient: Sequelize = app.get('sequelizeClient')
  const Aws = sequelizeClient.define<Model<AwsInterface>>('Aws', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      allowNull: false,
      primaryKey: true
    },
    keys: {
      type: DataTypes.JSON,
      allowNull: true
    },
    route53: {
      type: DataTypes.JSON,
      allowNull: true
    },
    s3: {
      type: DataTypes.JSON,
      allowNull: true
    },
    cloudfront: {
      type: DataTypes.JSON,
      allowNull: true
    },
    sms: {
      type: DataTypes.JSON,
      allowNull: true
    }
  })
  return Aws
}
