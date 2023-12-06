import * as faker from 'faker';
import { Major } from 'src/major/domain/entities/major.entity';

import { Branch } from 'src/organization/domain/entities/branch.entity';
import { College } from 'src/organization/domain/entities/college.entity';
import { Organization } from 'src/organization/domain/entities/organization.entity';
import { Region } from 'src/organization/domain/entities/region.entity';
import { OrganizationType } from 'src/organization/domain/enum/org_type.enum';
import { Sector } from 'src/organization/domain/enum/sector.enum';
import { AcceptanceCriteria } from 'src/program/domain/entities/acceptance_criteria.entity';
import { Program } from 'src/program/domain/entities/program.entity';
import { GenderRestriction } from 'src/program/domain/enum/gender_restriction.enum';
import { ProgramType } from 'src/program/domain/enum/program_type.enum';

let programIdCounter = 0;
let acceptanceCriteriaIdCounter = 0;
let regionIdCounter = 0;
let organizationIdCounter = 0;
let collegeIdCounter = 0;
let branchIdCounter = 0;
let majorIdCounter = 0;

export function resetMajorCounter() {
  majorIdCounter = 0;
}

const programFactory = (overrides?: Partial<Program>): Program => {
  return {
    id: ++programIdCounter,
    collegeID: faker.datatype.number(),
    majorID: faker.datatype.number(),
    name: faker.company.companyName(),
    applicationOpenDate: faker.date.past(),
    applicationCloseDate: faker.date.future(),
    programPlanURL: faker.internet.url(),
    genderRestriction: faker.random.arrayElement(
      Object.values(GenderRestriction),
    ),
    type: faker.random.arrayElement(Object.values(ProgramType)),
    requirements: faker.lorem.sentence(),
    lastAcceptableCumulative: faker.datatype.number({ min: 0, max: 100 }),

    totalYears: faker.datatype.number({ min: 1, max: 5 }),
    majorYears: faker.datatype.number({ min: 1, max: 5 }),
    prepYears: faker.datatype.number({ min: 1, max: 5 }),
    generalPrepYears: faker.datatype.number({ min: 1, max: 5 }),
    internshipYears: faker.datatype.number({ min: 1, max: 5 }),

    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    // Add defaults for optional associations if needed
    ...overrides,
  };
};

const acceptanceCriteriaFactory = (
  overrides?: Partial<AcceptanceCriteria>,
): AcceptanceCriteria => {
  return {
    id: ++acceptanceCriteriaIdCounter,
    organizationID: faker.datatype.number(),

    qudoratPercentage: faker.datatype.number(100),
    tahseelyPercentage: faker.datatype.number(100),
    highschoolGPAPercentage: faker.datatype.number(100),
    stepTestPercentage: faker.datatype.number(100),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
};

const regionFactory = (overrides?: Partial<Region>): Region => {
  return {
    id: ++regionIdCounter,
    name: faker.address.state(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
};

const organizationFactory = (
  overrides?: Partial<Organization>,
): Organization => {
  return {
    id: ++organizationIdCounter,
    name: faker.company.companyName(),
    imageURL: faker.image.imageUrl(),
    websiteURL: faker.image.imageUrl(),
    type: faker.random.arrayElement(Object.values(OrganizationType)),
    regionID: faker.datatype.number(),
    colleges: [], // Initialize with empty array or provide defaults
    branches: [], // Initialize with empty array or provide defaults
    region: null,
    programs: [],
    sector: faker.random.arrayElement(Object.values(Sector)),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
};

const collegeFactory = (overrides?: Partial<College>): College => {
  return {
    id: ++collegeIdCounter,
    name: faker.company.companyName(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),

    ...overrides,
  };
};

const branchFactory = (overrides?: Partial<Branch>): Branch => {
  return {
    id: ++branchIdCounter,
    organizationID: faker.datatype.number(),
    regionID: faker.datatype.number(),
    name: faker.company.companyName(),
    organization: null, // Provide a default or override
    colleges: [],
    programs: [],
    region: null,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
};

const majorFactory = (overrides?: Partial<Major>): Major => {
  return {
    id: ++majorIdCounter,
    title: faker.name.jobTitle(),
    briefDescription: faker.lorem.sentence(),
    potentialCareerFields: faker.name.jobArea(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
};

export {
  acceptanceCriteriaFactory,
  branchFactory,
  collegeFactory,
  majorFactory,
  organizationFactory,
  programFactory,
  regionFactory,
};
