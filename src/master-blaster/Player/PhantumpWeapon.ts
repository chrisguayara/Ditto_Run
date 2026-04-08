import Particle from "../../Wolfie2D/Nodes/Graphics/Particle";
import Color from "../../Wolfie2D/Utils/Color";
import RandUtils from "../../Wolfie2D/Utils/RandUtils";
import PlayerWeapon from "./PlayerWeapon";
import { EaseFunctionType } from "../../Wolfie2D/Utils/EaseFunctions";
/**
 * Phantump's purple particle attack extends PlayerWeapon, only color differs.
 */
export default class PhantumpWeapon extends PlayerWeapon {

    public setParticleAnimation(particle: Particle) {
        particle.vel = RandUtils.randVec(-32, 32, 100, 200);
        particle.vel.rotateCCW(this._rotation);
        particle.color = new Color(148, 0, 211); // purple

        particle.tweens.add("active", {
            startDelay: 0,
            duration: this.lifetime,
            effects: [
                {
                    property: "alpha",
                    start: 1,
                    end: 0,
                    ease: EaseFunctionType.IN_OUT_SINE
                }
            ]
        });
    }
}