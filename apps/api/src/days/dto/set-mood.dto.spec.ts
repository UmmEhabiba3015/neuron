import { Mood } from '@neuron/contracts';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { SetMoodDto } from './set-mood.dto';

const messagesFor = (body: unknown): string[] =>
  validateSync(plainToInstance(SetMoodDto, body)).flatMap((error) =>
    Object.values(error.constraints ?? {}),
  );

const MESSAGE = 'mood must be null or one of: Light, Good, Even, Low, Hard';

describe('SetMoodDto', () => {
  it.each(Object.values(Mood))('accepts %s', (mood) => {
    expect(messagesFor({ mood })).toEqual([]);
  });

  it('accepts null, which clears the mood', () => {
    expect(messagesFor({ mood: null })).toEqual([]);
  });

  it.each([
    ['a word that is not one of the five', 'Ecstatic'],
    ['a mood in the wrong case', 'good'],
    ['a number', 7],
    ['no mood at all', undefined],
  ])('refuses %s, and lists the five', (_label, mood) => {
    expect(messagesFor({ mood })).toEqual([MESSAGE]);
  });
});
