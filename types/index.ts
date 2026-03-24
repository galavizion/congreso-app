import type { Database } from './database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Congress = Database['public']['Tables']['congresses']['Row']
export type Stand = Database['public']['Tables']['stands']['Row']
export type Schedule = Database['public']['Tables']['schedules']['Row']
export type StandPost = Database['public']['Tables']['stand_posts']['Row']
export type Lead = Database['public']['Tables']['leads']['Row']
export type Points = Database['public']['Tables']['points']['Row']
export type Gift = Database['public']['Tables']['gifts']['Row']
export type Redemption = Database['public']['Tables']['redemptions']['Row']

export type Role = 'god' | 'congress' | 'stand' | 'attendee'