import { useState, useEffect } from 'react';
import { BookOpen, Clock, Target } from 'lucide-react';

interface Homework {
  id: string;
  targetPhoneme: string;
  goal: string;
  dailyPracticeMinutes: number;
  activities: string[];
  parentInstructions: string;
  repetitionTargets: string;
  status: string;
}

interface HomeworkViewerProps {
  caseId: string;
}

// Fallback mock data since learning_path.mock.json is minimal
const MOCK_HOMEWORK: Homework[] = [
  {
    id: 'hw-1',
    targetPhoneme: '/r/',
    goal: 'Word-initial /r/ production',
    dailyPracticeMinutes: 10,
    activities: [
      '5 min mirror drill on /r/ placement',
      '3 min minimal pairs practice',
      '2 min story retell recording'
    ],
    parentInstructions: 'Sit with your child during practice. Encourage them to watch their mouth in the mirror and focus on tongue placement.',
    repetitionTargets: 'Practice each word 10 times per session',
    status: 'Assigned by Therapist'
  },
  {
    id: 'hw-2',
    targetPhoneme: '/th/',
    goal: 'Voiced /th/ in sentences',
    dailyPracticeMinutes: 8,
    activities: [
      '4 min sentence drilling',
      '2 min conversation practice',
      '2 min reading aloud'
    ],
    parentInstructions: 'Focus on the vibrating feeling when producing voiced /th/. Use gentle reminders during conversation.',
    repetitionTargets: 'Practice each sentence 5 times',
    status: 'Assigned by Therapist'
  },
  {
    id: 'hw-3',
    targetPhoneme: '/s/',
    goal: 'Initial /s/ clusters',
    dailyPracticeMinutes: 12,
    activities: [
      '6 min cluster drills',
      '4 min word games',
      '2 min flashcard review'
    ],
    parentInstructions: 'Encourage slow, careful production. Use visual cues if needed to help with cluster blending.',
    repetitionTargets: 'Practice each cluster 8 times',
    status: 'Assigned by Therapist'
  }
];

export default function HomeworkViewer({ caseId }: HomeworkViewerProps) {
  const [homework, setHomework] = useState<Homework[]>(MOCK_HOMEWORK);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Try to load from actual mock file, fall back to MOCK_HOMEWORK
    loadHomework();
  }, []);

  const loadHomework = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch from the backend
      // For now, we use the fallback mock data
      setHomework(MOCK_HOMEWORK);
    } catch (error) {
      console.error('Failed to load homework:', error);
      setHomework(MOCK_HOMEWORK);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Homework Assignments</h1>
        <p className="text-sm text-gray-600 mt-1">
          View assigned homework exercises and practice activities
        </p>
      </div>

      {/* Homework Cards */}
      <div className="space-y-4">
        {homework.map((assignment) => (
          <div
            key={assignment.id}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                    {assignment.targetPhoneme}
                  </span>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                    {assignment.status}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{assignment.goal}</h3>
              </div>
            </div>

            {/* Practice Time */}
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Daily Practice: {assignment.dailyPracticeMinutes} minutes</span>
            </div>

            {/* Activities */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-gray-600" />
                <h4 className="text-sm font-medium text-gray-900">Prescribed Activities</h4>
              </div>
              <ul className="space-y-1 ml-6">
                {assignment.activities.map((activity, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    • {activity}
                  </li>
                ))}
              </ul>
            </div>

            {/* Parent Instructions */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-gray-600" />
                <h4 className="text-sm font-medium text-gray-900">Parent Instructions</h4>
              </div>
              <p className="text-sm text-gray-700 ml-6">{assignment.parentInstructions}</p>
            </div>

            {/* Repetition Targets */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Repetition Targets:</span>
                <span className="text-sm text-gray-700">{assignment.repetitionTargets}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Read-Only Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This is a read-only view of homework assignments assigned by the therapist.
          Modifications should be made through the therapy planning system.
        </p>
      </div>
    </div>
  );
}
