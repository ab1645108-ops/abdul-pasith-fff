import { MissingPerson, SightingLead } from '../types';

/**
 * Active missing persons registry.
 * Starts with an empty registry so that real cases can be entered by authorized investigators or reported via the public portal.
 */
export const INITIAL_MISSING_PERSONS: MissingPerson[] = [];

/**
 * Community and field sighting leads.
 * Starts empty ready to receive live verified sightings.
 */
export const INITIAL_SIGHTINGS: SightingLead[] = [];
