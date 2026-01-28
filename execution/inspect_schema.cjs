
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ebdcmiuzrrtmmphwxynw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZGNtaXV6cnJ0bW1waHd4eW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNzAyMjksImV4cCI6MjA4NDg0NjIyOX0.QNInacY_9ZhDUhNmiYTXVccYNxc0kk71EsdME9AKJW0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('Inspecting Tables...');
    
    // Check loja_compras columns by selecting one row
    const { data: compras, error: errorCompras } = await supabase.from('loja_compras').select('*').limit(1);
    if (errorCompras) console.error('Error fetching loja_compras:', errorCompras);
    else if (compras.length > 0) console.log('loja_compras columns:', Object.keys(compras[0]));
    else console.log('loja_compras is empty, cannot infer columns.');

    // Check if loja_produtos exists
    const { data: produtos, error: errorProdutos } = await supabase.from('loja_produtos').select('*').limit(1);
    if (errorProdutos) console.log('loja_produtos likely does not exist or error:', errorProdutos.message);
    else console.log('loja_produtos columns:', produtos.length > 0 ? Object.keys(produtos[0]) : 'Table exists but empty');

    // Check loja_app_state keys
    const { data: appState, error: errorState } = await supabase.from('loja_app_state').select('key').limit(10);
    if (errorState) console.error('Error fetching loja_app_state:', errorState);
    else console.log('loja_app_state keys:', appState.map(r => r.key));
}

inspect();
