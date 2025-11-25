import { NextRequest, NextResponse } from 'next/server';
import { getProjects, addProject, updateProject, deleteProject } from '@/lib/projects';
import { randomUUID } from 'crypto';
import { getIdentifier, checkLenientRateLimit, checkStandardRateLimit } from '@/lib/ratelimit';

export async function GET(request: NextRequest) {
  try {
    // Apply lenient rate limiting for read operations
    const identifier = getIdentifier(request);
    const rateLimitResponse = await checkLenientRateLimit(identifier);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const projects = await getProjects();
    return NextResponse.json({
      success: true,
      projects,
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch projects'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply standard rate limiting for write operations
    const identifier = getIdentifier(request);
    const rateLimitResponse = await checkStandardRateLimit(identifier);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const { title, subtitle, excerpt, tech, year, status, position } = body;

    if (!title || !subtitle || !excerpt) {
      return NextResponse.json(
        { success: false, error: 'Title, subtitle, and excerpt are required' },
        { status: 400 }
      );
    }

    const newProject = {
      id: randomUUID(),
      title,
      subtitle,
      excerpt,
      tech: tech || '',
      year: year || new Date().getFullYear().toString(),
      status: status || 'ONGOING',
      position: position || { x: 10, y: 100, size: 'medium' as const },
    };

    await addProject(newProject);

    return NextResponse.json({
      success: true,
      project: newProject,
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create project'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Apply standard rate limiting for write operations
    const identifier = getIdentifier(request);
    const rateLimitResponse = await checkStandardRateLimit(identifier);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    await updateProject(id, updates);

    return NextResponse.json({
      success: true,
      message: 'Project updated successfully',
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update project'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Apply standard rate limiting for delete operations
    const identifier = getIdentifier(request);
    const rateLimitResponse = await checkStandardRateLimit(identifier);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { searchParams} = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    await deleteProject(id);

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete project'
      },
      { status: 500 }
    );
  }
}
