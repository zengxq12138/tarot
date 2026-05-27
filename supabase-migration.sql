-- 塔罗占卜 数据库迁移脚本
-- 在 Supabase SQL Editor 中执行此文件

-- 1. 占卜记录表
CREATE TABLE IF NOT EXISTS public.readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'zh' CHECK (locale IN ('zh', 'en')),
  cards JSONB NOT NULL,
  interpretation TEXT NOT NULL DEFAULT '',
  is_favorited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 用户积分表
CREATE TABLE IF NOT EXISTS public.user_points (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 100,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. 积分流水表
CREATE TABLE IF NOT EXISTS public.points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('draw', 'interpret', 'admin_recharge', 'signup_bonus')),
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. 新用户注册自动赠送 100 积分
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_points (user_id, balance) VALUES (NEW.id, 100);
  INSERT INTO public.points_transactions (user_id, amount, type, balance_after)
  VALUES (NEW.id, 100, 'signup_bonus', 100);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. 积分扣减 RPC 函数（原子操作，防止并发问题）
CREATE OR REPLACE FUNCTION public.deduct_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  SELECT balance INTO v_balance
  FROM public.user_points
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', '用户积分账户不存在');
  END IF;

  IF v_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', '积分不足', 'balance', v_balance);
  END IF;

  v_new_balance := v_balance - p_amount;

  UPDATE public.user_points
  SET balance = v_new_balance, updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.points_transactions (user_id, amount, type, balance_after)
  VALUES (p_user_id, -p_amount, p_type, v_new_balance);

  RETURN jsonb_build_object('success', true, 'balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 管理员充值函数
CREATE OR REPLACE FUNCTION public.recharge_points(
  p_admin_id UUID,
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- 检查管理员权限（通过 raw_user_meta_data 判断）
  SELECT raw_user_meta_data->>'is_admin' = 'true' INTO v_is_admin
  FROM auth.users WHERE id = p_admin_id;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', '无管理员权限');
  END IF;

  SELECT balance INTO v_balance FROM public.user_points WHERE user_id = p_user_id;
  IF v_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', '用户积分账户不存在');
  END IF;

  v_new_balance := v_balance + p_amount;

  UPDATE public.user_points
  SET balance = v_new_balance, updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.points_transactions (user_id, amount, type, balance_after)
  VALUES (p_user_id, p_amount, 'admin_recharge', v_new_balance);

  RETURN jsonb_build_object('success', true, 'balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Row Level Security
ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

-- readings: 用户只能读写自己的记录
CREATE POLICY "Users can read own readings" ON public.readings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own readings" ON public.readings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own readings" ON public.readings
  FOR UPDATE USING (auth.uid() = user_id);

-- user_points: 用户只能查看自己的积分
CREATE POLICY "Users can read own points" ON public.user_points
  FOR SELECT USING (auth.uid() = user_id);

-- points_transactions: 用户只能查看自己的交易记录
CREATE POLICY "Users can read own transactions" ON public.points_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- 8. 索引
CREATE INDEX IF NOT EXISTS idx_readings_user_id ON public.readings(user_id);
CREATE INDEX IF NOT EXISTS idx_readings_created_at ON public.readings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id ON public.points_transactions(user_id);
