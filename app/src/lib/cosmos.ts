/**
 * Mate - Cosmos DB Client
 * Singleton client with CRUD operations for all containers
 */

import { CosmosClient, Container, Database } from '@azure/cosmos';
import type { User, Course, Assessment, StudyBlock, IntegrationLink } from '@/types';

// ============================================
// Cosmos Client Singleton
// ============================================

let client: CosmosClient | null = null;
let database: Database | null = null;

function getClient(): CosmosClient {
  if (!client) {
    const endpoint = process.env.COSMOS_ENDPOINT;
    const key = process.env.COSMOS_KEY;

    if (!endpoint || !key) {
      throw new Error('COSMOS_ENDPOINT and COSMOS_KEY must be set in environment variables');
    }

    client = new CosmosClient({ endpoint, key });
  }
  return client;
}

function getDatabase(): Database {
  if (!database) {
    const dbName = process.env.COSMOS_DATABASE || 'mate-dev-db';
    database = getClient().database(dbName);
  }
  return database;
}

function getContainer(containerName: string): Container {
  return getDatabase().container(containerName);
}

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 404
  );
}

// ============================================
// Container Names
// ============================================

export const CONTAINERS = {
  USERS: 'users',
  COURSES: 'courses',
  ASSESSMENTS: 'assessments',
  STUDY_BLOCKS: 'study_blocks',
  INTEGRATION_LINKS: 'integration_links',
} as const;

// ============================================
// User Operations
// ============================================

export async function createUser(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
  const container = getContainer(CONTAINERS.USERS);
  const newUser: User = {
    id: crypto.randomUUID(),
    ...user,
    created_at: new Date().toISOString(),
  };
  
  const { resource } = await container.items.create(newUser);
  return resource as User;
}

export async function getUser(userId: string): Promise<User | null> {
  const container = getContainer(CONTAINERS.USERS);
  try {
    const { resource } = await container.item(userId, userId).read<User>();
    return resource || null;
  } catch (error: unknown) {
    if (isNotFoundError(error)) return null;
    throw error;
  }
}

export async function getUserByAuthSubject(authSubject: string): Promise<User | null> {
  const container = getContainer(CONTAINERS.USERS);
  const { resources } = await container.items
    .query<User>({
      query: 'SELECT * FROM c WHERE c.auth_subject = @authSubject',
      parameters: [{ name: '@authSubject', value: authSubject }],
    })
    .fetchAll();
  
  return resources[0] || null;
}

// ============================================
// Course Operations
// ============================================

export async function createCourse(course: Omit<Course, 'id' | 'created_at'>): Promise<Course> {
  const container = getContainer(CONTAINERS.COURSES);
  const newCourse: Course = {
    id: crypto.randomUUID(),
    ...course,
    created_at: new Date().toISOString(),
  };
  
  const { resource } = await container.items.create(newCourse);
  return resource as Course;
}

export async function getCourse(courseId: string, userId: string): Promise<Course | null> {
  const container = getContainer(CONTAINERS.COURSES);
  try {
    const { resource } = await container.item(courseId, userId).read<Course>();
    return resource || null;
  } catch (error: unknown) {
    if (isNotFoundError(error)) return null;
    throw error;
  }
}

export async function getUserCourses(userId: string): Promise<Course[]> {
  const container = getContainer(CONTAINERS.COURSES);
  const { resources } = await container.items
    .query<Course>({
      query: 'SELECT * FROM c WHERE c.user_id = @userId',
      parameters: [{ name: '@userId', value: userId }],
    })
    .fetchAll();
  
  return resources;
}

// ============================================
// Assessment Operations
// ============================================

export async function createAssessment(assessment: Omit<Assessment, 'id'>): Promise<Assessment> {
  const container = getContainer(CONTAINERS.ASSESSMENTS);
  const newAssessment: Assessment = {
    id: crypto.randomUUID(),
    ...assessment,
  };
  
  const { resource } = await container.items.create(newAssessment);
  return resource as Assessment;
}

export async function createAssessments(assessments: Omit<Assessment, 'id'>[]): Promise<Assessment[]> {
  const container = getContainer(CONTAINERS.ASSESSMENTS);
  const created: Assessment[] = [];
  
  for (const assessment of assessments) {
    const newAssessment: Assessment = {
      id: crypto.randomUUID(),
      ...assessment,
    };
    const { resource } = await container.items.create(newAssessment);
    created.push(resource as Assessment);
  }
  
  return created;
}

export async function getAssessment(assessmentId: string, userId: string): Promise<Assessment | null> {
  const container = getContainer(CONTAINERS.ASSESSMENTS);
  try {
    const { resource } = await container.item(assessmentId, userId).read<Assessment>();
    return resource || null;
  } catch (error: unknown) {
    if (isNotFoundError(error)) return null;
    throw error;
  }
}

export async function updateAssessment(
  assessmentId: string,
  userId: string,
  updates: Partial<Assessment>
): Promise<Assessment> {
  const container = getContainer(CONTAINERS.ASSESSMENTS);
  const existing = await getAssessment(assessmentId, userId);
  
  if (!existing) {
    throw new Error(`Assessment ${assessmentId} not found`);
  }
  
  const updated = { ...existing, ...updates };
  const { resource } = await container.item(assessmentId, userId).replace(updated);
  return resource as Assessment;
}

export async function getUserAssessments(userId: string): Promise<Assessment[]> {
  const container = getContainer(CONTAINERS.ASSESSMENTS);
  const { resources } = await container.items
    .query<Assessment>({
      query: 'SELECT * FROM c WHERE c.user_id = @userId ORDER BY c.due_at',
      parameters: [{ name: '@userId', value: userId }],
    })
    .fetchAll();
  
  return resources;
}

export async function getCourseAssessments(courseId: string, userId: string): Promise<Assessment[]> {
  const container = getContainer(CONTAINERS.ASSESSMENTS);
  const { resources } = await container.items
    .query<Assessment>({
      query: 'SELECT * FROM c WHERE c.user_id = @userId AND c.course_id = @courseId ORDER BY c.due_at',
      parameters: [
        { name: '@userId', value: userId },
        { name: '@courseId', value: courseId },
      ],
    })
    .fetchAll();
  
  return resources;
}

export async function approveAssessments(assessmentIds: string[], userId: string): Promise<Assessment[]> {
  const approved: Assessment[] = [];
  
  for (const id of assessmentIds) {
    const updated = await updateAssessment(id, userId, {
      review_state: 'approved',
      approved_at: new Date().toISOString(),
    });
    approved.push(updated);
  }
  
  return approved;
}

// ============================================
// Study Block Operations
// ============================================

export async function createStudyBlock(block: Omit<StudyBlock, 'id' | 'created_at'>): Promise<StudyBlock> {
  const container = getContainer(CONTAINERS.STUDY_BLOCKS);
  const newBlock: StudyBlock = {
    id: crypto.randomUUID(),
    ...block,
    created_at: new Date().toISOString(),
  };
  
  const { resource } = await container.items.create(newBlock);
  return resource as StudyBlock;
}

export async function getUserStudyBlocks(userId: string): Promise<StudyBlock[]> {
  const container = getContainer(CONTAINERS.STUDY_BLOCKS);
  const { resources } = await container.items
    .query<StudyBlock>({
      query: 'SELECT * FROM c WHERE c.user_id = @userId ORDER BY c.start_at',
      parameters: [{ name: '@userId', value: userId }],
    })
    .fetchAll();
  
  return resources;
}

// ============================================
// Integration Link Operations
// ============================================

export async function createIntegrationLink(link: Omit<IntegrationLink, 'id' | 'created_at'>): Promise<IntegrationLink> {
  const container = getContainer(CONTAINERS.INTEGRATION_LINKS);
  const newLink: IntegrationLink = {
    id: crypto.randomUUID(),
    ...link,
    created_at: new Date().toISOString(),
  };
  
  const { resource } = await container.items.create(newLink);
  return resource as IntegrationLink;
}

export async function getUserIntegrationLinks(userId: string): Promise<IntegrationLink[]> {
  const container = getContainer(CONTAINERS.INTEGRATION_LINKS);
  const { resources } = await container.items
    .query<IntegrationLink>({
      query: 'SELECT * FROM c WHERE c.user_id = @userId',
      parameters: [{ name: '@userId', value: userId }],
    })
    .fetchAll();
  
  return resources;
}

// ============================================
// Utility Functions
// ============================================

export async function testConnection(): Promise<boolean> {
  try {
    const db = getDatabase();
    await db.read();
    return true;
  } catch (error) {
    console.error('Cosmos DB connection test failed:', error);
    return false;
  }
}

export function generateDocumentHash(content: string): string {
  // Simple hash for deduplication
  // In production, use a proper hash function
  return Buffer.from(content).toString('base64').substring(0, 32);
}
