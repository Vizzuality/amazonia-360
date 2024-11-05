resource "aws_instance" "amazonia360-ec2" {
  ami           = var.ami
  instance_type = var.instance_type
  subnet_id     = var.subnet_id
  vpc_security_group_ids = var.security_group_ids
  key_name = aws_key_pair.local_public_key.key_name
  associate_public_ip_address = true

  user_data = <<-EOF
  #!/bin/bash
  echo "${var.authorized_key}" >> /home/ubuntu/.ssh/authorized_keys
  EOF

  tags = {
    Name = var.instance_name
  }
}


resource "aws_key_pair" "local_public_key" {
  key_name = "amazonia360-key-pair-${var.environment}"
  public_key = file("~/.ssh/key_amazonia360_ec2.pub")
}
