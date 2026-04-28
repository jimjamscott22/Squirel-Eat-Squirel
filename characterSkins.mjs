export const DEFAULT_CHARACTER = "squirrel";

export const CHARACTER_CHOICES = [
  {
    id: "squirrel",
    label: "Squirrel",
    description: "Bushy tail, round ears, tiny paws",
  },
  {
    id: "chipmunk",
    label: "Chipmunk",
    description: "Striped back, quick forest scout",
  },
  {
    id: "fox",
    label: "Fox",
    description: "Pointed ears, white-tipped tail",
  },
];

const characterIds = new Set(CHARACTER_CHOICES.map((character) => character.id));

export function normalizeCharacterChoice(value) {
  return characterIds.has(value) ? value : DEFAULT_CHARACTER;
}
