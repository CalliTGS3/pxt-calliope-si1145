enum SI1145_ADDR {
    //% block="0x60"
    ADDR_0x60 = 0x60
}

enum ILLUMINANCE {
    //% block="lx"
    LUX = 1,
    //% block="fc"
    FC = 2
}

enum DISTANCE {
    //% block="m"
    METER = 1,
    //% block="cm"
    CENTIMETER = 2
}

/**
 * SI1145 block
 */
//% weight=30 color=#7d6608 icon="\uf0c2"
namespace SI1145 {
    let SI1145_I2C_ADDR = SI1145_ADDR.ADDR_0x60

    function setreg(reg: number, dat: number): void {
        let buf = pins.createBuffer(2);
        buf[0] = reg;
        buf[1] = dat;
        pins.i2cWriteBuffer(SI1145_I2C_ADDR, buf);
    }

    function getreg(reg: number): number {
        pins.i2cWriteNumber(SI1145_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(SI1145_I2C_ADDR, NumberFormat.UInt8BE);
    }

    function getInt8LE(reg: number): number {
        pins.i2cWriteNumber(SI1145_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(SI1145_I2C_ADDR, NumberFormat.Int8LE);
    }

    function getUInt16LE(reg: number): number {
        pins.i2cWriteNumber(SI1145_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(SI1145_I2C_ADDR, NumberFormat.UInt16LE);
    }

    function getInt16LE(reg: number): number {
        pins.i2cWriteNumber(SI1145_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(SI1145_I2C_ADDR, NumberFormat.Int16LE);
    }

    function writeParam(p: number, v: number) {
        setreg(0x17, v)
        setreg(0x18, p | 0xA0)
        return getreg(0x2E);
    }

    function reset(): void {
        setreg(0x08, 0x00)
        setreg(0x09, 0x00)
        setreg(0x04, 0x00)
        setreg(0x05, 0x00)
        setreg(0x06, 0x00)
        setreg(0x03, 0x00)
        setreg(0x21, 0xFF)
        setreg(0x18, 0x01)
        basic.pause(10)
        setreg(0x07, 0x17)
        basic.pause(10)
    }

    //% blockId="init_SI1145" block="Initialisiere Lichtmessung"
    export function init_SI1145(): void {
        let id: number = getreg(0x00)

        if (id != 0x45) console.log("SI1145 not connected")

        reset()

        // enable UVindex measurement coefficients!
        setreg(0x13, 0x29);
        setreg(0x14, 0x89);
        setreg(0x15, 0x02);
        setreg(0x16, 0x00);

        // enable UV sensor
        writeParam(0x01, 0x80 | 0x20 | 0x10 | 0x01);
        // enable interrupt on every sample
        setreg(0x03, 0x01);
        setreg(0x04, 0x01);


        // program LED current
        setreg(0x0F, 0x03); // 20mA for LED 1 only
        writeParam(0x07, 0x03);
        // prox sensor #1 uses LED #1
        writeParam(0x02, 0x01);
        // fastest clocks, clock div 1
        writeParam(0x0B, 0);
        // take 511 clocks to measure
        writeParam(0x0A, 0x70);
        // in prox mode, high range
        writeParam(0x0C, 0x20 | 0x04);

        writeParam(0x0E, 0x00);
        // fastest clocks, clock div 1
        writeParam(0x1E, 0);
        // take 511 clocks to measure
        writeParam(0x1D, 0x70);
        // in high range mode
        writeParam(0x1F, 0x20);

        // fastest clocks, clock div 1
        writeParam(0x11, 0);
        // take 511 clocks to measure
        writeParam(0x10, 0x70);
        // in high range mode (not normal signal)
        writeParam(0x12, 0x20);

        // measurement rate for auto
        setreg(0x08, 0xFF); // 255 * 31.25uS = 8ms

        // auto run
        setreg(0x18, 0x0F);
    }

    /**
     * Ultra Violet Index
    */
    //% blockId="readUVI" block="Ermittle Ultraviolett Index"
    export function readUVI(): number {
        return (getUInt16LE(0x2C) / 100)
    }

    /**
     *  Ambient Light Intensity
    */
    //% blockId="readLight" block="Ermittle Helligkeit Wert in %unit"
    export function readLight(unit: ILLUMINANCE): number {

        if (unit == ILLUMINANCE.LUX) {
            return getUInt16LE(0x22)
        } else if (unit == ILLUMINANCE.FC) {
            return (getUInt16LE(0x22) / 10764)
        }
        return 0
    }

    /**
     *  Infra Red Intensity
    */
    //% blockId="readIR" block="Ermittle Infrarot Wert"
    export function readIR(): number {
        return getUInt16LE(0x24)
    }

    /**
     *  Proximity
    */
    // blockId="readProximity" block="Ermittle Abstand in %unit"
    function readProximity(unit: DISTANCE): number {

        if (unit == DISTANCE.CENTIMETER) {
            return getUInt16LE(0x26)
        } else if (unit == DISTANCE.METER) {
            return (getUInt16LE(0x26) / 100)
        }
        return 0
    }
}
