import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [notRobot, setNotRobot] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin && !notRobot) {
      toast({
        title: "Ошибка",
        description: "Подтвердите, что вы не робот",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        toast({
          title: "Регистрация успешна!",
          description: "Добро пожаловать в Паркорд!",
        });
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-card border border-border rounded-lg shadow-glow">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-primary">Паркорд</h1>
          <p className="text-muted-foreground">
            {isLogin ? "Войдите в систему" : "Создайте аккаунт"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="username">Имя пользователя</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={!isLogin}
                className="bg-secondary border-border"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-secondary border-border"
            />
          </div>

          {!isLogin && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notRobot"
                checked={notRobot}
                onCheckedChange={(checked) => setNotRobot(checked === true)}
              />
              <Label htmlFor="notRobot" className="text-sm cursor-pointer">
                Я не робот
              </Label>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow"
            disabled={loading}
          >
            {loading ? "Загрузка..." : isLogin ? "Войти" : "Зарегистрироваться"}
          </Button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-primary hover:underline"
          >
            {isLogin
              ? "Нет аккаунта? Зарегистрируйтесь"
              : "Уже есть аккаунт? Войдите"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
