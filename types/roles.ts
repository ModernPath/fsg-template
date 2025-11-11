/**
 * BizExit - Role System Types
 * TypeScript definitions for role-based access control and AI features
 */

// ============================================================================
// USER ROLES
// ============================================================================

export type UserRole = 'visitor' | 'buyer' | 'seller' | 'broker' | 'partner' | 'admin'

export const USER_ROLES: Record<UserRole, { label: string; description: string; color: string }> = {
  visitor: {
    label: 'Vierailija',
    description: 'Ei-rekisteröitynyt käyttäjä',
    color: 'gray'
  },
  buyer: {
    label: 'Ostaja',
    description: 'Etsii yrityksiä ostettavaksi',
    color: 'blue'
  },
  seller: {
    label: 'Myyjä',
    description: 'Myy yritystään',
    color: 'green'
  },
  broker: {
    label: 'Välittäjä',
    description: 'Ammattilainen joka avustaa yrityskaupassa',
    color: 'purple'
  },
  partner: {
    label: 'Kumppani',
    description: 'Palveluntarjoaja (pankki, vakuutus, lakitoimisto)',
    color: 'orange'
  },
  admin: {
    label: 'Admin',
    description: 'Platformin ylläpitäjä',
    color: 'red'
  }
}

// ============================================================================
// PERMISSIONS
// ============================================================================

export type Resource = 
  | 'companies'
  | 'listings'
  | 'deals'
  | 'ndas'
  | 'documents'
  | 'analytics'
  | 'users'
  | 'system'
  | 'favorites'
  | 'commissions'
  | 'proposals'

export type Action = 'create' | 'read' | 'update' | 'delete'

export interface RolePermission {
  id: string
  role: UserRole
  resource: Resource
  action: Action
  conditions?: Record<string, any>
  created_at: string
}

export interface PermissionConditions {
  public?: boolean
  owner?: boolean
  participant?: boolean
  invited?: boolean
  assigned?: boolean
  as_buyer?: boolean
  as_seller?: boolean
  after_nda?: boolean
  requiresOwnership?: boolean
}

// Permission check result
export interface PermissionCheck {
  allowed: boolean
  reason?: string
  conditions?: PermissionConditions
}

// User permissions map
export type UserPermissions = Partial<Record<Resource, Partial<Record<Action, boolean>>>>

// ============================================================================
// USER PROFILE
// ============================================================================

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  role: UserRole
  is_admin: boolean
  email_verified: boolean
  onboarding_completed: boolean
  preferences: Record<string, any>
  created_at: string
  updated_at: string
  // Relations
  user_organizations?: Array<{
    organization_id: string
    role: string
    organizations?: {
      id: string
      name: string
      type: string
    }
  }>
}

export interface UserRoleHistory {
  id: string
  user_id: string
  old_role: UserRole | null
  new_role: UserRole
  changed_by: string | null
  reason: string | null
  created_at: string
}

// ============================================================================
// AI SYSTEM
// ============================================================================

export type AIInteractionType = 
  | 'chat'
  | 'analysis'
  | 'generation'
  | 'recommendation'
  | 'optimization'
  | 'matchmaking'

export interface AIInteraction {
  id: string
  user_id: string
  session_id: string | null
  interaction_type: AIInteractionType
  context: Record<string, any> | null
  input_data: Record<string, any> | null
  output_data: Record<string, any> | null
  model: string | null
  tokens_used: number | null
  latency_ms: number | null
  feedback: number | null // 1-5 rating
  created_at: string
}

export type AIContentType = 
  | 'teaser'
  | 'im'           // Information Memorandum
  | 'cim'          // Confidential Information Memorandum
  | 'email'
  | 'analysis'
  | 'report'
  | 'proposal'
  | 'summary'
  | 'recommendation'

export interface AIGeneratedContent {
  id: string
  user_id: string
  content_type: AIContentType
  reference_id: string | null
  reference_type: string | null
  content: Record<string, any>
  model: string | null
  prompt: string | null
  status: 'draft' | 'published' | 'archived'
  created_at: string
  updated_at: string
}

// AI Chat
export interface AIChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: Record<string, any>
}

export interface AIChatSession {
  id: string
  user_id: string
  messages: AIChatMessage[]
  context?: Record<string, any>
  created_at: string
  updated_at: string
}

// AI Analysis
export interface AIFinancialAnalysis {
  company_id: string
  revenue_trend: 'growing' | 'stable' | 'declining'
  profitability: 'high' | 'medium' | 'low'
  risk_level: 'low' | 'medium' | 'high'
  valuation_range: {
    min: number
    max: number
    recommended: number
  }
  key_metrics: Record<string, any>
  insights: string[]
  red_flags: string[]
  confidence_score: number // 0-100
}

// AI Recommendations
export interface AIRecommendation {
  id: string
  type: 'company' | 'buyer' | 'action' | 'optimization'
  title: string
  description: string
  score: number // 0-100
  reasons: string[]
  action?: {
    label: string
    url: string
  }
  metadata?: Record<string, any>
}

// AI Matchmaking
export interface AIMatch {
  buyer_id?: string
  seller_id?: string
  company_id: string
  score: number // 0-100
  reasons: string[]
  compatibility_factors: {
    industry: number
    size: number
    location: number
    financial_fit: number
    strategic_fit: number
  }
}

// ============================================================================
// DASHBOARD DATA
// ============================================================================

export interface DashboardStats {
  companies?: number
  totalDeals?: number
  pipelineValue?: number
  activeDeals?: number
  // Buyer specific
  favorites?: number
  activeNDAs?: number
  // Seller specific
  views?: number
  interested?: number
  // Broker specific
  commissions?: number
  clients?: number
  // Partner specific
  projects?: number
  proposals?: number
}

export interface DashboardData {
  stats: DashboardStats
  recentDeals?: any[]
  activities?: any[]
  recommendations?: AIRecommendation[]
  tasks?: any[]
  aiInsights?: string[]
}

// ============================================================================
// ROLE-SPECIFIC FEATURES
// ============================================================================

// Buyer
export interface BuyerPreferences {
  industries: string[]
  locations: string[]
  min_revenue?: number
  max_revenue?: number
  min_price?: number
  max_price?: number
  keywords?: string[]
}

export interface SavedCompany {
  id: string
  user_id: string
  company_id: string
  notes?: string
  created_at: string
}

// Seller
export interface ListingOptimization {
  current_score: number // 0-100
  suggestions: Array<{
    type: 'content' | 'pricing' | 'images' | 'documents'
    priority: 'high' | 'medium' | 'low'
    description: string
    action?: string
  }>
  estimated_improvement: number
}

// Broker
export interface BrokerPipeline {
  stage: string
  deals: any[]
  value: number
  count: number
}

export interface BrokerTask {
  id: string
  deal_id: string
  title: string
  description: string
  due_date: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'completed'
  assigned_to?: string
}

// Partner
export interface PartnerProposal {
  id: string
  partner_id: string
  deal_id: string
  type: 'financing' | 'insurance' | 'legal' | 'other'
  content: Record<string, any>
  amount?: number
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface RoleConfig {
  role: UserRole
  label: string
  description: string
  color: string
  features: string[]
  dashboardConfig: {
    layout: 'default' | 'kanban' | 'list' | 'grid'
    widgets: string[]
    aiFeatures: string[]
  }
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  visitor: {
    role: 'visitor',
    label: 'Vierailija',
    description: 'Ei-rekisteröitynyt käyttäjä',
    color: 'gray',
    features: ['browse_listings', 'search_companies'],
    dashboardConfig: {
      layout: 'grid',
      widgets: ['featured_companies', 'cta_register'],
      aiFeatures: ['chatbot']
    }
  },
  buyer: {
    role: 'buyer',
    label: 'Ostaja',
    description: 'Etsii yrityksiä ostettavaksi',
    color: 'blue',
    features: [
      'browse_listings',
      'save_favorites',
      'request_nda',
      'view_documents',
      'make_offers',
      'ai_recommendations',
      'ai_analysis'
    ],
    dashboardConfig: {
      layout: 'default',
      widgets: ['favorites', 'active_deals', 'recommendations', 'ai_chat'],
      aiFeatures: ['recommendations', 'analysis', 'chat', 'valuation']
    }
  },
  seller: {
    role: 'seller',
    label: 'Myyjä',
    description: 'Myy yritystään',
    color: 'green',
    features: [
      'create_listings',
      'manage_companies',
      'view_interest',
      'manage_ndas',
      'upload_documents',
      'view_analytics',
      'ai_optimization',
      'ai_generation'
    ],
    dashboardConfig: {
      layout: 'default',
      widgets: ['my_companies', 'nda_requests', 'analytics', 'ai_insights'],
      aiFeatures: ['optimization', 'generation', 'pricing', 'matchmaking']
    }
  },
  broker: {
    role: 'broker',
    label: 'Välittäjä',
    description: 'Ammattilainen joka avustaa yrityskaupassa',
    color: 'purple',
    features: [
      'manage_portfolio',
      'create_listings',
      'manage_deals',
      'matchmaking',
      'client_management',
      'commission_tracking',
      'ai_workflow',
      'ai_matchmaking'
    ],
    dashboardConfig: {
      layout: 'kanban',
      widgets: ['pipeline', 'tasks', 'clients', 'commissions', 'ai_assistant'],
      aiFeatures: ['matchmaking', 'workflow', 'predictions', 'automation']
    }
  },
  partner: {
    role: 'partner',
    label: 'Kumppani',
    description: 'Palveluntarjoaja (pankki, vakuutus, lakitoimisto)',
    color: 'orange',
    features: [
      'view_assigned_deals',
      'create_proposals',
      'upload_documents',
      'manage_billing',
      'ai_risk_assessment',
      'ai_proposal_generation'
    ],
    dashboardConfig: {
      layout: 'list',
      widgets: ['active_projects', 'proposals', 'billing', 'ai_tools'],
      aiFeatures: ['risk_assessment', 'proposal_generation', 'analysis']
    }
  },
  admin: {
    role: 'admin',
    label: 'Admin',
    description: 'Platformin ylläpitäjä',
    color: 'red',
    features: [
      'manage_users',
      'manage_content',
      'view_analytics',
      'system_settings',
      'support',
      'ai_moderation',
      'ai_insights'
    ],
    dashboardConfig: {
      layout: 'default',
      widgets: ['users', 'deals', 'analytics', 'system_health', 'ai_monitoring'],
      aiFeatures: ['moderation', 'insights', 'predictions', 'optimization']
    }
  }
}

// ============================================================================
// API TYPES
// ============================================================================

export interface CheckPermissionRequest {
  resource: Resource
  action: Action
  resourceId?: string
}

export interface CheckPermissionResponse {
  allowed: boolean
  reason?: string
}

export interface ChangeRoleRequest {
  userId: string
  newRole: UserRole
  reason?: string
}

export interface AIQueryRequest {
  query: string
  context?: Record<string, any>
  sessionId?: string
}

export interface AIQueryResponse {
  response: string
  sessionId: string
  suggestions?: string[]
  actions?: Array<{
    label: string
    url: string
  }>
}

export interface AIGenerateRequest {
  type: AIContentType
  input: Record<string, any>
  reference?: {
    type: string
    id: string
  }
}

export interface AIGenerateResponse {
  content: Record<string, any>
  contentId: string
  model: string
}

