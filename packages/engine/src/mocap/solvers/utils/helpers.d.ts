/*
CPAL-1.0 License

The contents of this file are subject to the Common Public Attribution License
Version 1.0. (the "License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at
https://github.com/EtherealEngine/etherealengine/blob/dev/LICENSE.
The License is based on the Mozilla Public License Version 1.1, but Sections 14
and 15 have been added to cover use of software over a computer network and 
provide for limited attribution for the Original Developer. In addition, 
Exhibit A has been modified to be consistent with Exhibit B.

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for the
specific language governing rights and limitations under the License.

The Original Code is Ethereal Engine.

The Original Developer is the Initial Developer. The Initial Developer of the
Original Code is the Ethereal Engine team.

All portions of the code written by the Ethereal Engine team are Copyright © 2021-2023 
Ethereal Engine. All Rights Reserved.
*/


/**
 * Returns a clamped value between min and max values
 * @param {Number} val : transformed value
 * @param {Number} min : minimum value
 * @param {Number} max : maximum value
 */
export declare const clamp: (val: number, min: number, max: number) => number;
/**
 * Returns a remapped value between 0 and 1 using min and max values
 * @param {Number} value : transformed value
 * @param {Number} min : minimum value
 * @param {Number} max : maximum value
 */
export declare const remap: (val: number, min: number, max: number) => number;
/** A set of default pose values in radians to serve as "rest" values */
export declare const RestingDefault: {
    Face: {
        eye: {
            l: number;
            r: number;
        };
        mouth: {
            x: number;
            y: number;
            shape: {
                A: number;
                E: number;
                I: number;
                O: number;
                U: number;
            };
        };
        head: {
            x: number;
            y: number;
            z: number;
            width: number;
            height: number;
            position: {
                x: number;
                y: number;
                z: number;
            };
        };
        brow: number;
        pupil: {
            x: number;
            y: number;
        };
    };
    Pose: {
        RightUpperArm: {
            x: number;
            y: number;
            z: number;
        };
        LeftUpperArm: {
            x: number;
            y: number;
            z: number;
        };
        RightLowerArm: {
            x: number;
            y: number;
            z: number;
        };
        LeftLowerArm: {
            x: number;
            y: number;
            z: number;
        };
        LeftUpperLeg: {
            x: number;
            y: number;
            z: number;
        };
        RightUpperLeg: {
            x: number;
            y: number;
            z: number;
        };
        RightLowerLeg: {
            x: number;
            y: number;
            z: number;
        };
        LeftLowerLeg: {
            x: number;
            y: number;
            z: number;
        };
        LeftHand: {
            x: number;
            y: number;
            z: number;
        };
        RightHand: {
            x: number;
            y: number;
            z: number;
        };
        Spine: {
            x: number;
            y: number;
            z: number;
        };
        Hips: {
            position: {
                x: number;
                y: number;
                z: number;
            };
            rotation: {
                x: number;
                y: number;
                z: number;
            };
        };
    };
    RightHand: {
        RightWrist: {
            x: number;
            y: number;
            z: number;
        };
        RightRingProximal: {
            x: number;
            y: number;
            z: number;
        };
        RightRingIntermediate: {
            x: number;
            y: number;
            z: number;
        };
        RightRingDistal: {
            x: number;
            y: number;
            z: number;
        };
        RightIndexProximal: {
            x: number;
            y: number;
            z: number;
        };
        RightIndexIntermediate: {
            x: number;
            y: number;
            z: number;
        };
        RightIndexDistal: {
            x: number;
            y: number;
            z: number;
        };
        RightMiddleProximal: {
            x: number;
            y: number;
            z: number;
        };
        RightMiddleIntermediate: {
            x: number;
            y: number;
            z: number;
        };
        RightMiddleDistal: {
            x: number;
            y: number;
            z: number;
        };
        RightThumbProximal: {
            x: number;
            y: number;
            z: number;
        };
        RightThumbIntermediate: {
            x: number;
            y: number;
            z: number;
        };
        RightThumbDistal: {
            x: number;
            y: number;
            z: number;
        };
        RightLittleProximal: {
            x: number;
            y: number;
            z: number;
        };
        RightLittleIntermediate: {
            x: number;
            y: number;
            z: number;
        };
        RightLittleDistal: {
            x: number;
            y: number;
            z: number;
        };
    };
    LeftHand: {
        LeftWrist: {
            x: number;
            y: number;
            z: number;
        };
        LeftRingProximal: {
            x: number;
            y: number;
            z: number;
        };
        LeftRingIntermediate: {
            x: number;
            y: number;
            z: number;
        };
        LeftRingDistal: {
            x: number;
            y: number;
            z: number;
        };
        LeftIndexProximal: {
            x: number;
            y: number;
            z: number;
        };
        LeftIndexIntermediate: {
            x: number;
            y: number;
            z: number;
        };
        LeftIndexDistal: {
            x: number;
            y: number;
            z: number;
        };
        LeftMiddleProximal: {
            x: number;
            y: number;
            z: number;
        };
        LeftMiddleIntermediate: {
            x: number;
            y: number;
            z: number;
        };
        LeftMiddleDistal: {
            x: number;
            y: number;
            z: number;
        };
        LeftThumbProximal: {
            x: number;
            y: number;
            z: number;
        };
        LeftThumbIntermediate: {
            x: number;
            y: number;
            z: number;
        };
        LeftThumbDistal: {
            x: number;
            y: number;
            z: number;
        };
        LeftLittleProximal: {
            x: number;
            y: number;
            z: number;
        };
        LeftLittleIntermediate: {
            x: number;
            y: number;
            z: number;
        };
        LeftLittleDistal: {
            x: number;
            y: number;
            z: number;
        };
    };
};
