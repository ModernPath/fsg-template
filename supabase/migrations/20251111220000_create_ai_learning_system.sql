-- ============================================================================
-- AI LEARNING SYSTEM
-- ============================================================================
-- 
-- Purpose: Enable AI to learn from user interactions and improve over time
-- 
-- Tables:
-- 1. ai_conversations: Track all AI conversations
-- 2. ai_learnings: Store learned insights about users/companies
-- 3. ai_context_memory: Long-term memory for AI agents
-- 4. ai_feedback: User feedback on AI responses
-- 
-- ============================================================================

-- ============================================================================
-- 1. AI CONVERSATIONS
-- ============================================================================
-- Store all conversations between users and AI agents
-- Enables: conversation history, context building, training data

CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who & What
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL, -- 'seller_ai', 'broker_ai', 'buyer_ai', 'cfo_assistant'
  
  -- Context
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- Conversation
  messages JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {role, content, timestamp}
  
  -- Metadata
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'archived'
  
  -- Summary (updated after conversation)
  summary TEXT,
  key_insights JSONB, -- {insights: [], decisions: [], action_items: []}
  
  -- Performance
  message_count INTEGER NOT NULL DEFAULT 0,
  avg_response_time_ms INTEGER,
  user_satisfaction_score INTEGER, -- 1-5, null if not rated
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_company_id ON ai_conversations(company_id);
CREATE INDEX idx_ai_conversations_deal_id ON ai_conversations(deal_id);
CREATE INDEX idx_ai_conversations_agent_type ON ai_conversations(agent_type);
CREATE INDEX idx_ai_conversations_status ON ai_conversations(status);
CREATE INDEX idx_ai_conversations_last_message_at ON ai_conversations(last_message_at DESC);

-- ============================================================================
-- 2. AI LEARNINGS
-- ============================================================================
-- Store learned insights about users, companies, and patterns
-- Enables: personalization, better recommendations, context awareness

CREATE TABLE IF NOT EXISTS ai_learnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What did we learn?
  learning_type TEXT NOT NULL, -- 'user_preference', 'company_pattern', 'deal_insight', 'market_trend'
  category TEXT NOT NULL, -- 'financial', 'behavioral', 'industry', 'communication'
  
  -- About whom/what?
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  
  -- The learning
  insight TEXT NOT NULL, -- Human-readable insight
  data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Structured data
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.5, -- 0.0 to 1.0
  
  -- Source
  source_conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL, -- 'conversation', 'document_analysis', 'behavior_pattern', 'external_data'
  
  -- Validation
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  
  -- Usage tracking
  times_used INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  effectiveness_score DECIMAL(3,2), -- How useful was this learning?
  
  -- Lifecycle
  expires_at TIMESTAMPTZ, -- Some learnings may expire
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_learnings_user_id ON ai_learnings(user_id) WHERE NOT archived;
CREATE INDEX idx_ai_learnings_company_id ON ai_learnings(company_id) WHERE NOT archived;
CREATE INDEX idx_ai_learnings_deal_id ON ai_learnings(deal_id) WHERE NOT archived;
CREATE INDEX idx_ai_learnings_type_category ON ai_learnings(learning_type, category) WHERE NOT archived;
CREATE INDEX idx_ai_learnings_confidence ON ai_learnings(confidence DESC) WHERE NOT archived;

-- ============================================================================
-- 3. AI CONTEXT MEMORY
-- ============================================================================
-- Long-term memory for AI agents
-- Stores important context that should persist across conversations

CREATE TABLE IF NOT EXISTS ai_context_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Memory scope
  scope_type TEXT NOT NULL, -- 'user', 'company', 'deal', 'organization'
  scope_id UUID NOT NULL, -- ID of the scoped entity
  
  -- Memory content
  memory_type TEXT NOT NULL, -- 'fact', 'preference', 'goal', 'constraint', 'warning'
  key TEXT NOT NULL, -- e.g., 'preferred_communication_style', 'target_valuation'
  value JSONB NOT NULL,
  
  -- Metadata
  importance TEXT NOT NULL DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
  confidence DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  
  -- Source tracking
  source_conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
  source_learning_id UUID REFERENCES ai_learnings(id) ON DELETE SET NULL,
  created_by TEXT, -- 'user_input', 'ai_inference', 'system'
  
  -- Lifecycle
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ, -- NULL =永続
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique keys per scope
  UNIQUE(scope_type, scope_id, key)
);

-- Indexes
CREATE INDEX idx_ai_context_memory_scope ON ai_context_memory(scope_type, scope_id);
CREATE INDEX idx_ai_context_memory_type ON ai_context_memory(memory_type);
CREATE INDEX idx_ai_context_memory_importance ON ai_context_memory(importance);
CREATE INDEX idx_ai_context_memory_valid ON ai_context_memory(valid_from, valid_until);

-- ============================================================================
-- 4. AI FEEDBACK
-- ============================================================================
-- User feedback on AI responses and suggestions
-- Enables: AI improvement, quality monitoring, training data

CREATE TABLE IF NOT EXISTS ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What was rated?
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  message_index INTEGER, -- Which message in the conversation
  
  -- Who rated?
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Rating
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback_type TEXT NOT NULL, -- 'helpful', 'not_helpful', 'inaccurate', 'inappropriate', 'excellent'
  
  -- Details
  comment TEXT,
  specific_issues JSONB, -- {issues: ['too_generic', 'missed_context', 'wrong_numbers']}
  
  -- Action taken
  action_taken TEXT, -- 'improved_response', 'flagged_for_review', 'added_to_training'
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_feedback_conversation_id ON ai_feedback(conversation_id);
CREATE INDEX idx_ai_feedback_user_id ON ai_feedback(user_id);
CREATE INDEX idx_ai_feedback_rating ON ai_feedback(rating);
CREATE INDEX idx_ai_feedback_type ON ai_feedback(feedback_type);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_context_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

-- ai_conversations policies
CREATE POLICY "Users can view their own conversations"
  ON ai_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON ai_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON ai_conversations FOR UPDATE
  USING (auth.uid() = user_id);

-- ai_learnings policies (users can see learnings about themselves/their companies)
-- BizExit uses user_organizations -> organizations -> companies structure
CREATE POLICY "Users can view learnings about themselves"
  ON ai_learnings FOR SELECT
  USING (
    auth.uid() = user_id 
    OR company_id IN (
      -- BizExit: Users can see companies in their organizations
      SELECT c.id 
      FROM companies c
      INNER JOIN user_organizations uo ON uo.organization_id = c.organization_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- ai_context_memory policies
CREATE POLICY "Users can view their context memory"
  ON ai_context_memory FOR SELECT
  USING (
    (scope_type = 'user' AND scope_id = auth.uid())
    OR (scope_type = 'company' AND scope_id IN (
      -- BizExit: Users can access companies in their organizations
      SELECT c.id 
      FROM companies c
      INNER JOIN user_organizations uo ON uo.organization_id = c.organization_id
      WHERE uo.user_id = auth.uid()
    ))
    OR (scope_type = 'organization' AND scope_id IN (
      -- BizExit: Users can access their organizations
      SELECT organization_id 
      FROM user_organizations
      WHERE user_id = auth.uid()
    ))
  );

-- ai_feedback policies
CREATE POLICY "Users can submit feedback"
  ON ai_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
  ON ai_feedback FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to add message to conversation
CREATE OR REPLACE FUNCTION add_ai_message(
  p_conversation_id UUID,
  p_role TEXT,
  p_content TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE ai_conversations
  SET 
    messages = messages || jsonb_build_object(
      'role', p_role,
      'content', p_content,
      'timestamp', NOW()
    ),
    message_count = message_count + 1,
    last_message_at = NOW(),
    updated_at = NOW()
  WHERE id = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record AI learning
CREATE OR REPLACE FUNCTION record_ai_learning(
  p_learning_type TEXT,
  p_category TEXT,
  p_user_id UUID,
  p_insight TEXT,
  p_data JSONB,
  p_confidence DECIMAL,
  p_source_conversation_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_learning_id UUID;
BEGIN
  INSERT INTO ai_learnings (
    learning_type,
    category,
    user_id,
    insight,
    data,
    confidence,
    source_conversation_id,
    source_type
  ) VALUES (
    p_learning_type,
    p_category,
    p_user_id,
    p_insight,
    p_data,
    p_confidence,
    p_source_conversation_id,
    CASE WHEN p_source_conversation_id IS NOT NULL THEN 'conversation' ELSE 'system' END
  ) RETURNING id INTO v_learning_id;
  
  RETURN v_learning_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user context for AI
CREATE OR REPLACE FUNCTION get_ai_context(
  p_user_id UUID,
  p_company_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_context JSONB;
BEGIN
  SELECT jsonb_build_object(
    'user_memories', (
      SELECT jsonb_agg(jsonb_build_object(
        'key', key,
        'value', value,
        'importance', importance
      ))
      FROM ai_context_memory
      WHERE scope_type = 'user' 
        AND scope_id = p_user_id
        AND (valid_until IS NULL OR valid_until > NOW())
      ORDER BY importance DESC, last_accessed_at DESC
      LIMIT 20
    ),
    'company_memories', (
      SELECT jsonb_agg(jsonb_build_object(
        'key', key,
        'value', value,
        'importance', importance
      ))
      FROM ai_context_memory
      WHERE scope_type = 'company' 
        AND scope_id = p_company_id
        AND (valid_until IS NULL OR valid_until > NOW())
      ORDER BY importance DESC, last_accessed_at DESC
      LIMIT 20
    ),
    'recent_learnings', (
      SELECT jsonb_agg(jsonb_build_object(
        'insight', insight,
        'confidence', confidence,
        'category', category
      ))
      FROM ai_learnings
      WHERE user_id = p_user_id
        AND NOT archived
        AND confidence > 0.7
      ORDER BY created_at DESC
      LIMIT 10
    )
  ) INTO v_context;
  
  RETURN v_context;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE ai_conversations IS 'Stores all AI agent conversations for context and learning';
COMMENT ON TABLE ai_learnings IS 'Learned insights about users, companies, and patterns';
COMMENT ON TABLE ai_context_memory IS 'Long-term memory for AI agents across conversations';
COMMENT ON TABLE ai_feedback IS 'User feedback on AI responses for continuous improvement';

