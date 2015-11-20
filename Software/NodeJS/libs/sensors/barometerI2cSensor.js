var I2cSensor  = require('./base/i2cSensor')
var commands   = require('../commands')

function BarometerI2cSensor(moduleType) {
  I2cSensor.apply(this, Array.prototype.slice.call(arguments))
  this.moduleType = moduleType || BarometerI2cSensor.VERSION.BMP085
}

BarometerI2cSensor.prototype = new I2cSensor()
BarometerI2cSensor.VERSION = {
    'BMP085' : 0
}
BarometerI2cSensor.COMMANDS = {
    HP20X_I2C_DEV_ID      : [0x76]     // Barometer device address
  , HP20X_SOFT_RST        : [0x06]     // Soft reset the device
  , OK_HP20X_DEV          : [0X80]     // Default value for
  , HP20X_READ_PARA_REG   : [0x8F]     // Read Register
  , HP20X_ADC_CVT         : [0x48]     // Digital filter rate and channel
  , HP20X_READ_P          : [0x30]     // Read Pressure
  , HP20X_READ_A          : [0x31]     // Read Altitude
  , HP20X_READ_T          : [0x32]      //Read Temperature
}
BarometerI2cSensor.prototype.isAvailable = function() {
  var write = this.board.writeBytes(BarometerI2cSensor.COMMANDS.HP20X_READ_PARA_REG.concat([commands.unused, commands.unused, commands.unused]), BarometerI2cSensor.COMMANDS.HP20X_I2C_DEV_ID)
  if (write) {
    this.board.readByte(BarometerI2cSensor.COMMANDS.HP20X_I2C_DEV_ID)
    return this.board.readBytes(BarometerI2cSensor.COMMANDS.HP20X_I2C_DEV_ID) == BarometerI2cSensor.COMMANDS.OK_HP20X_DEV
  } else {
    return false
  }
}
BarometerI2cSensor.prototype.readSubSensor = function(sensor) {
  this.board.writeBytes(BarometerI2cSensor.COMMANDS.HP20X_ADC_CVT.concat([commands.unused, commands.unused, commands.unused]), BarometerI2cSensor.COMMANDS.HP20X_I2C_DEV_ID)

  this.board.wait(25)

  this.board.writeBytes(sensor.concat([commands.unused, commands.unused, commands.unused]), BarometerI2cSensor.COMMANDS.HP20X_I2C_DEV_ID)

  var bytes = this.board.readBytes(9, BarometerI2cSensor.COMMANDS.HP20X_I2C_DEV_ID)
  if (bytes instanceof Buffer) {
    return bytes[1] << 16 | bytes[2] << 8 | bytes[3]
  } else
    return false
}
BarometerI2cSensor.prototype.read = function() {
  var write = this.board.writeBytes(BarometerI2cSensor.COMMANDS.HP20X_SOFT_RST.concat([commands.unused, commands.unused, commands.unused]), BarometerI2cSensor.COMMANDS.HP20X_I2C_DEV_ID)
  if (write) {
    this.board.wait(100)
    if (this.isAvailable()) {
      // [ temperature, pressure, altitude ]
      return [
              this.readSubSensor(BarometerI2cSensor.COMMANDS.HP20X_READ_T),
              this.readSubSensor(BarometerI2cSensor.COMMANDS.HP20X_READ_P),
              this.readSubSensor(BarometerI2cSensor.COMMANDS.HP20X_READ_A),
             ]
    }
  } else {
    return false
  }
}

module.exports = BarometerI2cSensor