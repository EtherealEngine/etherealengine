/**
 * @fileoverview
 * Overview of the {@link typedoc https://typedoc.org/guides/doccomments/} features used by EE.
 *
 * Cat ipsum dolor sit amet, walk on car leaving trail of paw prints on hood and windshield fat baby cat best buddy little guy yet freak human out make funny noise mow mow mow mow mow mow success now attack human. Adventure always.
 * Demand to have some of whatever the human is cooking, then sniff the offering and walk away chew master's slippers.
 * Run as fast as i can into another room for no reason and sometimes switches in french and say "miaou" just because well why not skid on floor, crash into wall but sniff catnip and act crazy.
 * Steal raw zucchini off kitchen counter jump off balcony, onto stranger's head for blow up sofa in 3 seconds.
 * Why use post when this sofa is here lasers are tiny mice so lies down toilet paper attack claws fluff everywhere meow miao french ciao litterbox.
 */

import { Vector3 } from 'three'

/**
 * @description
 * Description of an awesome type.
 *
 * Cereal boxes make for five star accommodation put toy mouse in food bowl run out of litter box at full speed yet with tail in the air.
 * Hack up furballs bird bird bird bird bird bird human why take bird out i could have eaten that.
 * Instead of drinking water from the cat bowl, make sure to steal water from the toilet if it fits i sits for find something else more interesting, and if it fits, i sits or find a way to fit in tiny box for throwup on your pillow, yet dead stare with ears cocked.
 * Kitty scratches couch bad kitty.
 */
type AwesomeType = { a: '123'; b: 'abc'; c: '42' }

/**
 * @description
 * Checks if given position is a valid position to move avatar too.
 *
 * Mark territory purr like a car engine oh yes, there is my human slave woman she does best pats ever that all i like about her hiss meow.
 * Give me attention or face the wrath of my claws meow so fight own tail.
 * Lay on arms while you're using the keyboard get scared by doggo also cucumerro Gate keepers of hell lick the plastic bag.
 * Lick yarn hanging out of own butt small kitty warm kitty little balls of fur but where is my slave? I'm getting hungry.
 * @param position
 * @param [onlyAllowPositionOnGround=true] if set will only consider the given position as valid if it falls on the ground
 * @param [raycastDirection=new Vector3(0, -1, 0)] Direction to check for collisions.
 * @returns positionValid the given position is a valid position
 * @returns raycastHit the raycastHit result of the physics raycast
 */
export default function checkPositionIsValid(
  position: AwesomeType,
  onlyAllowPositionOnGround = true,
  raycastDirection = new Vector3(0, -1, 0)
) {}
