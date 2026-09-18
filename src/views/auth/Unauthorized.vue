<template>
  <div class="unauthorized-container">
    <div class="unauthorized-card">
      <div class="icon">🚫</div>
      <h2>Acesso Negado</h2>
      <p>Você não possui permissão para acessar esta área ou loja.</p>

      <div class="actions">
        <router-link to="/login" class="btn-primary">Ir para o Login</router-link>
        <router-link to="/" class="btn-secondary">Página Inicial</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'UnauthorizedView'
})
</script>

<style scoped>
.unauthorized-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f8fafc;
  font-family: system-ui, -apple-system, sans-serif;
  padding: 1rem;
}
.unauthorized-card {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  text-align: center;
  max-width: 420px;
  width: 100%;
  border: 1px solid #e2e8f0;
}
.icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}
.unauthorized-card h2 {
  font-size: 1.5rem;
  color: #dc2626;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
}
.unauthorized-card p {
  color: #64748b;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.btn-primary {
  background: #2563eb;
  color: white;
  padding: 0.75rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: background 0.2s;
}
.btn-primary:hover {
  background: #1d4ed8;
}
.btn-secondary {
  background: #f1f5f9;
  color: #475569;
  padding: 0.75rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: background 0.2s;
}
.btn-secondary:hover {
  background: #e2e8f0;
}
</style>
