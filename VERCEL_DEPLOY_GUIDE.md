# 🚀 Guia Completo: Deploy no Vercel + Domínio Próprio

## 📝 Parte 1: Preparar o Frontend

### 1.1 Obter URL do Backend Railway
No Railway Dashboard, copie a URL do seu backend:
```
https://stemuc-ai-live-production.up.railway.app
```

### 1.2 ✅ Configuração da API (JÁ IMPLEMENTADA)
O arquivo `src/config/api.ts` já foi criado com:
- Configuração automática da URL da API
- Helpers para requests e uploads
- Funções de download de arquivos
- Debug em desenvolvimento

### 1.3 ✅ Componentes Atualizados (JÁ IMPLEMENTADOS)
Os componentes já foram atualizados para usar a nova configuração:
- `src/pages/Index.tsx` - Usa `fetchUpload` para envio de arquivos
- `src/components/FileUpload.tsx` - Validação e upload
- `src/components/ResultsView.tsx` - Reprodução e download

### 1.4 Criar arquivo .env.production
```bash
# Copiar do template
cp env.production.template .env.production

# Ou criar manualmente:
echo "VITE_API_URL=https://stemuc-ai-live-production.up.railway.app" > .env.production
```

### 1.5 ✅ .gitignore Atualizado (JÁ CONFIGURADO)
O `.gitignore` já permite `.env.production` para deploy:
```gitignore
# Allow .env.production for Vercel deployment
!.env.production
```

### 1.6 Testar Build Local
```bash
# Método 1: Script automático (Linux/Mac)
npm run test:build

# Método 2: Script PowerShell (Windows)
npm run test:build:ps

# Método 3: Manual
npm run build:prod
npm run preview
```

## 📝 Parte 2: Deploy no Vercel

### 2.1 Instalar Vercel CLI
```bash
npm install -g vercel
```

### 2.2 Login no Vercel
```bash
vercel login
```

### 2.3 Configurar Projeto
```bash
# Na raiz do projeto
vercel

# Responder as perguntas:
# ? Set up and deploy "~/stemuc-ai-meres"? [Y/n] Y
# ? Which scope do you want to deploy to? [Seu usuário]
# ? Link to existing project? [y/N] N
# ? What's your project's name? stemuc-audio-forge
# ? In which directory is your code located? ./
```

### 2.4 Configurar Variáveis de Ambiente
```bash
# Adicionar variável de produção
vercel env add VITE_API_URL production
# Valor: https://stemuc-ai-live-production.up.railway.app

# Ou via dashboard Vercel:
# 1. Ir para Settings > Environment Variables
# 2. Adicionar: VITE_API_URL = https://stemuc-ai-live-production.up.railway.app
```

### 2.5 Deploy de Produção
```bash
# Deploy automático
vercel --prod

# Ou usar script npm
npm run deploy:frontend
```

## 📝 Parte 3: Configurar Domínio Próprio

### 3.1 No Dashboard Vercel
1. Acesse seu projeto no [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá para **Settings** > **Domains**
3. Clique em **Add Domain**
4. Digite seu domínio: `seudominio.com`

### 3.2 Configurar DNS
No seu provedor de domínio (GoDaddy, Namecheap, etc.):

**Para domínio raiz (seudominio.com):**
```
Type: A
Name: @
Value: 76.76.19.61
```

**Para subdomínio (www.seudominio.com):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3.3 Aguardar Propagação
- DNS pode levar até 48h para propagar
- Vercel configurará SSL automaticamente
- Você receberá email de confirmação

## 📝 Parte 4: Configurações Avançadas

### 4.1 Arquivo vercel.json (JÁ CONFIGURADO)
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "env": {
    "VITE_API_URL": "@vite_api_url"
  },
  "build": {
    "env": {
      "VITE_API_URL": "@vite_api_url"
    }
  },
  "functions": {
    "app/api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, PUT, DELETE, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
      ]
    }
  ]
}
```

### 4.2 Configurar CORS no Backend
No seu backend Railway, certifique-se que o CORS permite seu domínio:
```python
# backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://seudominio.com",
        "https://www.seudominio.com",
        "https://stemuc-audio-forge.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 📝 Parte 5: Scripts de Automação

### 5.1 Deploy Completo
```bash
# Deploy frontend e backend
npm run deploy:full
```

### 5.2 Verificação de Saúde
```bash
# Verificar backend
npm run check:backend

# Verificar configurações
npm run check:env
```

### 5.3 Rollback (se necessário)
```bash
# Listar deployments
vercel ls

# Fazer rollback para deployment anterior
vercel rollback [deployment-url]
```

## 📝 Parte 6: Monitoramento e Manutenção

### 6.1 Analytics Vercel
- Acesse **Analytics** no dashboard
- Monitore performance e uso
- Configure alertas se necessário

### 6.2 Logs e Debug
```bash
# Ver logs em tempo real
vercel logs [deployment-url] --follow

# Debug build
vercel build --debug
```

### 6.3 Atualizações Automáticas
- Conecte repositório GitHub ao Vercel
- Deploy automático a cada push na branch main
- Preview deployments para PRs

## 🎯 Checklist Final

- [ ] ✅ Backend Railway funcionando
- [ ] ✅ Arquivo `src/config/api.ts` criado
- [ ] ✅ Componentes atualizados
- [ ] ✅ `.env.production` configurado
- [ ] ✅ Build local testado
- [ ] 🔄 Vercel CLI instalado
- [ ] 🔄 Projeto configurado no Vercel
- [ ] 🔄 Variáveis de ambiente definidas
- [ ] 🔄 Deploy de produção realizado
- [ ] 🔄 Domínio configurado (opcional)
- [ ] 🔄 DNS propagado
- [ ] 🔄 SSL ativo
- [ ] 🔄 CORS configurado no backend
- [ ] 🔄 Testes de funcionalidade

## 🚨 Troubleshooting

### Build Falha
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
```

### API não conecta
1. Verificar URL no `.env.production`
2. Testar backend diretamente: `curl https://seu-backend.railway.app/health`
3. Verificar CORS no backend
4. Verificar logs do Vercel

### Domínio não funciona
1. Verificar configuração DNS
2. Aguardar propagação (até 48h)
3. Verificar SSL no Vercel
4. Testar com `dig seudominio.com`

## 📞 Suporte

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Vite Docs**: https://vitejs.dev/guide/

---

**🎉 Parabéns! Seu Stemuc Audio Forge está pronto para produção!** 